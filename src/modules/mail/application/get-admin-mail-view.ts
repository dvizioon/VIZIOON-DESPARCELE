import { EMAIL_PURPOSES } from "../domain/purposes";
import type { MailRepository } from "../domain/mail-repository";

export async function getAdminMailView(mail: MailRepository) {
  const [providers, routes, outbox] = await Promise.all([
    mail.listProviders(),
    mail.listPurposeRoutes(),
    mail.listOutbox(40),
  ]);

  return {
    providers: providers.map((item) => ({
      id: item.id,
      name: item.name,
      host: item.host,
      port: item.port,
      secure: item.secure,
      username: item.username,
      fromAddress: item.fromAddress,
      replyTo: item.replyTo,
      active: item.active,
      isDefault: item.isDefault,
      hasPassword: Boolean(item.password),
    })),
    purposes: EMAIL_PURPOSES.map((purpose) => {
      const saved = routes.find((item) => item.purpose === purpose.id);
      return {
        purpose: purpose.id,
        providerId: saved?.providerId ?? null,
        subjectTemplate: saved?.subjectTemplate ?? purpose.defaultSubject,
        bodyTemplate: saved?.bodyTemplate ?? purpose.defaultBody,
        bodyFormat: saved?.bodyFormat ?? purpose.defaultFormat,
        active: saved?.active ?? true,
      };
    }),
    outbox: outbox.map((item) => ({
      id: item.id,
      purpose: item.purpose,
      toEmail: item.toEmail,
      subject: item.subject,
      status: item.status,
      error: item.error,
      attempts: item.attempts,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
