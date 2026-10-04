import nodemailer from "nodemailer";
import type { SmtpConfig } from "../domain/mail";

export async function sendSmtpMail(
  config: SmtpConfig,
  input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!config.host.trim() || !config.fromAddress.trim()) {
    return { ok: false, message: "SMTP incompleto. Informe host e remetente." };
  }

  const transporter = nodemailer.createTransport({
    host: config.host.trim(),
    port: config.port || 587,
    secure: config.secure || config.port === 465,
    auth:
      config.username && config.password
        ? { user: config.username, pass: config.password }
        : undefined,
  });

  try {
    await transporter.sendMail({
      from: config.fromAddress.trim(),
      replyTo: config.replyTo || undefined,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar";
    return { ok: false, message };
  }
}
