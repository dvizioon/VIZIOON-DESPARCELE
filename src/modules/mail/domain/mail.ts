export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  password: string | null;
  fromAddress: string;
  replyTo: string | null;
};

export type EmailProvider = {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  password: string | null;
  fromAddress: string;
  replyTo: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailProviderPublic = Omit<EmailProvider, "password"> & {
  hasPassword: boolean;
};

export type EmailPurposeRoute = {
  id: string;
  purpose: string;
  providerId: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  bodyFormat: "HTML" | "TEXT";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailOutboxItem = {
  id: string;
  purpose: string;
  providerId: string | null;
  toEmail: string;
  subject: string;
  body: string;
  format: "HTML" | "TEXT";
  status: "PENDING" | "SENT" | "FAILED";
  error: string | null;
  attempts: number;
  variables: Record<string, string> | null;
  sentAt: Date | null;
  createdAt: Date;
};

export function toPublicProvider(provider: EmailProvider): EmailProviderPublic {
  return {
    id: provider.id,
    name: provider.name,
    host: provider.host,
    port: provider.port,
    secure: provider.secure,
    username: provider.username,
    fromAddress: provider.fromAddress,
    replyTo: provider.replyTo,
    active: provider.active,
    isDefault: provider.isDefault,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    hasPassword: Boolean(provider.password),
  };
}

export function toSmtpConfig(provider: EmailProvider): SmtpConfig {
  return {
    host: provider.host,
    port: provider.port,
    secure: provider.secure,
    username: provider.username,
    password: provider.password,
    fromAddress: provider.fromAddress,
    replyTo: provider.replyTo,
  };
}
