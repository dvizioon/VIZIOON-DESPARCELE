import { fail, ok, type Result } from "@/shared/types/result";
import { publicBrandAssetUrl } from "@/shared/brand/resolve-brand-asset";
import { getAppOrigin } from "@/shared/config/app-origin";
import { SMTP_TEST_MAIL_HTML } from "../domain/email-layout";
import { toPublicProvider, toSmtpConfig, type EmailProviderPublic } from "../domain/mail";
import type { MailRepository, SaveProviderInput, SavePurposeInput } from "../domain/mail-repository";
import { applyEmailTemplate, findEmailPurpose } from "../domain/purposes";
import { sendSmtpMail } from "../infrastructure/smtp-sender";
import { dispatchMail } from "./dispatch-mail";

export async function saveSmtpProvider(
  input: SaveProviderInput,
  mail: MailRepository,
): Promise<Result<EmailProviderPublic>> {
  if (input.name.trim().length < 2) {
    return fail("INVALID_NAME", "Informe um nome para o SMTP");
  }

  if (!input.host.trim()) {
    return fail("INVALID_HOST", "Informe o host SMTP");
  }

  if (!input.fromAddress.includes("@")) {
    return fail("INVALID_FROM", "Informe o e-mail remetente");
  }

  if (!input.id && !input.password.trim()) {
    return fail("INVALID_PASSWORD", "Informe a senha SMTP");
  }

  const saved = await mail.saveProvider({
    ...input,
    name: input.name.trim(),
    host: input.host.trim(),
    fromAddress: input.fromAddress.trim(),
    username: input.username.trim(),
    replyTo: input.replyTo.trim(),
    keepPassword: Boolean(input.id && !input.password.trim()),
  });

  return ok(toPublicProvider(saved));
}

export async function testSmtpProvider(
  providerId: string,
  to: string,
  format: "HTML" | "TEXT",
  message: string,
  mail: MailRepository,
): Promise<Result<{ sent: true }>> {
  const provider = await mail.findProvider(providerId);
  if (!provider || !provider.active) {
    return fail("NOT_FOUND", "SMTP nao encontrado ou inativo");
  }

  if (!to.includes("@")) {
    return fail("INVALID_EMAIL", "Informe um e-mail de teste");
  }

  const origin = await getAppOrigin();
  const custom = message.trim();
  const text = custom || "Este é um e-mail de teste do Desparcele.";
  const logo = await publicBrandAssetUrl("logo");
  const html =
    format === "HTML"
      ? applyEmailTemplate(SMTP_TEST_MAIL_HTML, {
          logo,
          link: `${origin}/login`,
          mensagem: custom || "Se você está lendo isto, o envio saiu.",
        }).replace(/src=(["'])data:image\/[^"']+\1/gi, `src=$1${logo}$1`)
      : undefined;
  const body = html ?? text;

  const item = await mail.createOutbox({
    purpose: "smtp_test",
    providerId: provider.id,
    toEmail: to,
    subject: "Teste SMTP Desparcele",
    body,
    format,
    variables: { email: to },
  });

  const sent = await sendSmtpMail(toSmtpConfig(provider), {
    to,
    subject: "Teste SMTP Desparcele",
    text: format === "HTML" ? stripTags(html ?? text) : text,
    html,
  });

  if (!sent.ok) {
    await mail.markOutboxFailed(item.id, sent.message);
    return fail("SMTP_FAILED", sent.message);
  }

  await mail.markOutboxSent(item.id);
  return ok({ sent: true });
}

export async function testPurpose(
  purpose: string,
  to: string,
  mail: MailRepository,
): Promise<Result<{ outboxId: string }>> {
  const definition = findEmailPurpose(purpose);
  if (!definition) {
    return fail("UNKNOWN_PURPOSE", "Finalidade desconhecida");
  }

  if (!to.includes("@")) {
    return fail("INVALID_EMAIL", "Informe um e-mail de teste");
  }

  return dispatchMail(purpose, to, { ...definition.sample, email: to }, mail);
}

export async function savePurposeRoute(
  input: SavePurposeInput,
  mail: MailRepository,
): Promise<Result<{ saved: true }>> {
  if (!findEmailPurpose(input.purpose)) {
    return fail("UNKNOWN_PURPOSE", "Finalidade desconhecida");
  }

  if (!input.subjectTemplate.trim()) {
    return fail("INVALID_SUBJECT", "Informe o assunto");
  }

  if (!input.bodyTemplate.trim()) {
    return fail("INVALID_BODY", "Informe o conteudo");
  }

  await mail.savePurposeRoute({
    ...input,
    subjectTemplate: input.subjectTemplate.trim(),
    bodyTemplate: input.bodyTemplate.trim(),
    providerId: input.providerId || null,
  });

  return ok({ saved: true });
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
