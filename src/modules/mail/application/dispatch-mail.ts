import { fail, ok, type Result } from "@/shared/types/result";
import { publicBrandAssetUrl } from "@/shared/brand/resolve-brand-asset";
import { getAppOrigin, withPublicOrigin } from "@/shared/config/app-origin";
import { applyEmailTemplate, findEmailPurpose } from "../domain/purposes";
import { toSmtpConfig } from "../domain/mail";
import type { MailRepository } from "../domain/mail-repository";
import { sendSmtpMail } from "../infrastructure/smtp-sender";

async function withMailVars(variables: Record<string, string>): Promise<Record<string, string>> {
  const origin = await getAppOrigin();
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    next[key] = withPublicOrigin(value, origin);
  }

  return {
    ...next,
    logo: next.logo || (await publicBrandAssetUrl("logo")),
    link: next.link || `${origin}/login`,
  };
}

export async function dispatchMail(
  purpose: string,
  toEmail: string,
  variables: Record<string, string>,
  mail: MailRepository,
): Promise<Result<{ outboxId: string }>> {
  const definition = findEmailPurpose(purpose);
  if (!definition) {
    return fail("UNKNOWN_PURPOSE", "Finalidade de e-mail desconhecida");
  }

  const route = await mail.findPurposeRoute(purpose);
  const subjectTemplate = route?.subjectTemplate || definition.defaultSubject;
  const bodyTemplate = route?.bodyTemplate || definition.defaultBody;
  const format = route?.bodyFormat || definition.defaultFormat;

  if (route && !route.active) {
    return fail("PURPOSE_DISABLED", "Essa finalidade esta desligada");
  }

  const providerId = route?.providerId ?? (await mail.findDefaultProvider())?.id ?? null;
  const provider = providerId ? await mail.findProvider(providerId) : await mail.findDefaultProvider();

  const vars = await withMailVars(variables);
  const subject = applyEmailTemplate(subjectTemplate, vars);
  const body = scrubEmbeddedDataImages(applyEmailTemplate(bodyTemplate, vars), vars.logo ?? "");
  const text = stripHtml(body);

  const item = await mail.createOutbox({
    purpose,
    providerId: provider?.id ?? null,
    toEmail,
    subject,
    body,
    format,
    variables: vars,
  });

  if (!provider || !provider.active) {
    await mail.markOutboxFailed(item.id, "Nenhum SMTP ativo configurado");
    return fail("SMTP_MISSING", "Nenhum SMTP ativo configurado");
  }

  const sent = await sendSmtpMail(toSmtpConfig(provider), {
    to: toEmail,
    subject,
    text,
    html: format === "HTML" ? body : undefined,
  });

  if (!sent.ok) {
    await mail.markOutboxFailed(item.id, sent.message);
    return fail("SMTP_FAILED", sent.message);
  }

  await mail.markOutboxSent(item.id);
  return ok({ outboxId: item.id });
}

export async function retryOutbox(id: string, mail: MailRepository): Promise<Result<{ outboxId: string }>> {
  const item = await mail.findOutbox(id);
  if (!item) {
    return fail("NOT_FOUND", "Item da fila nao encontrado");
  }

  const provider = item.providerId
    ? await mail.findProvider(item.providerId)
    : await mail.findDefaultProvider();

  if (!provider || !provider.active) {
    await mail.markOutboxFailed(item.id, "Nenhum SMTP ativo configurado");
    return fail("SMTP_MISSING", "Nenhum SMTP ativo configurado");
  }

  const sent = await sendSmtpMail(toSmtpConfig(provider), {
    to: item.toEmail,
    subject: item.subject,
    text: stripHtml(item.body),
    html: item.format === "HTML" ? item.body : undefined,
  });

  if (!sent.ok) {
    await mail.markOutboxFailed(item.id, sent.message);
    return fail("SMTP_FAILED", sent.message);
  }

  await mail.markOutboxSent(item.id);
  return ok({ outboxId: item.id });
}

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Modelos antigos embutiam data-URI; clientes (Gmail) bloqueiam. Troca pela URL pública. */
function scrubEmbeddedDataImages(html: string, logoUrl: string): string {
  return html.replace(/src=(["'])data:image\/[^"']+\1/gi, `src=$1${logoUrl}$1`);
}
