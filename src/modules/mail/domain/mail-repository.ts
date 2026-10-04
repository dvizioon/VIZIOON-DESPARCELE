import type { EmailOutboxItem, EmailProvider, EmailPurposeRoute } from "./mail";

export type SaveProviderInput = {
  id?: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  replyTo: string;
  active: boolean;
  isDefault: boolean;
  keepPassword?: boolean;
};

export type SavePurposeInput = {
  purpose: string;
  providerId: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  bodyFormat: "HTML" | "TEXT";
  active: boolean;
};

export type CreateOutboxInput = {
  purpose: string;
  providerId: string | null;
  toEmail: string;
  subject: string;
  body: string;
  format: "HTML" | "TEXT";
  variables: Record<string, string>;
};

export interface MailRepository {
  listProviders(): Promise<EmailProvider[]>;
  findProvider(id: string): Promise<EmailProvider | null>;
  findDefaultProvider(): Promise<EmailProvider | null>;
  saveProvider(input: SaveProviderInput): Promise<EmailProvider>;
  deleteProvider(id: string): Promise<void>;
  listPurposeRoutes(): Promise<EmailPurposeRoute[]>;
  findPurposeRoute(purpose: string): Promise<EmailPurposeRoute | null>;
  savePurposeRoute(input: SavePurposeInput): Promise<EmailPurposeRoute>;
  createOutbox(input: CreateOutboxInput): Promise<EmailOutboxItem>;
  markOutboxSent(id: string): Promise<void>;
  markOutboxFailed(id: string, error: string): Promise<void>;
  listOutbox(limit?: number): Promise<EmailOutboxItem[]>;
  findOutbox(id: string): Promise<EmailOutboxItem | null>;
}
