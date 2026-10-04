import { prisma } from "@/shared/infrastructure/prisma";
import type { EmailOutboxItem, EmailProvider, EmailPurposeRoute } from "../domain/mail";
import type {
  CreateOutboxInput,
  MailRepository,
  SaveProviderInput,
  SavePurposeInput,
} from "../domain/mail-repository";

export class PrismaMailRepository implements MailRepository {
  async listProviders(): Promise<EmailProvider[]> {
    const rows = await prisma.emailProvider.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(mapProvider);
  }

  async findProvider(id: string): Promise<EmailProvider | null> {
    const row = await prisma.emailProvider.findUnique({ where: { id } });
    return row ? mapProvider(row) : null;
  }

  async findDefaultProvider(): Promise<EmailProvider | null> {
    const row =
      (await prisma.emailProvider.findFirst({
        where: { active: true, isDefault: true },
      })) ??
      (await prisma.emailProvider.findFirst({
        where: { active: true },
        orderBy: { createdAt: "asc" },
      }));
    return row ? mapProvider(row) : null;
  }

  async saveProvider(input: SaveProviderInput): Promise<EmailProvider> {
    if (input.isDefault) {
      await prisma.emailProvider.updateMany({ data: { isDefault: false } });
    }

    const data = {
      name: input.name,
      host: input.host,
      port: input.port,
      secure: input.secure,
      username: input.username || null,
      fromAddress: input.fromAddress,
      replyTo: input.replyTo || null,
      active: input.active,
      isDefault: input.isDefault,
    };

    if (input.id) {
      const current = await prisma.emailProvider.findUnique({ where: { id: input.id } });
      if (!current) {
        throw new Error("Provedor nao encontrado");
      }

      const row = await prisma.emailProvider.update({
        where: { id: input.id },
        data: {
          ...data,
          password: input.keepPassword ? current.password : input.password || null,
        },
      });
      return mapProvider(row);
    }

    const row = await prisma.emailProvider.create({
      data: {
        ...data,
        password: input.password || null,
      },
    });
    return mapProvider(row);
  }

  async deleteProvider(id: string): Promise<void> {
    await prisma.emailProvider.delete({ where: { id } });
  }

  async listPurposeRoutes(): Promise<EmailPurposeRoute[]> {
    const rows = await prisma.emailPurposeRoute.findMany({ orderBy: { purpose: "asc" } });
    return rows.map(mapRoute);
  }

  async findPurposeRoute(purpose: string): Promise<EmailPurposeRoute | null> {
    const row = await prisma.emailPurposeRoute.findUnique({ where: { purpose } });
    return row ? mapRoute(row) : null;
  }

  async savePurposeRoute(input: SavePurposeInput): Promise<EmailPurposeRoute> {
    const row = await prisma.emailPurposeRoute.upsert({
      where: { purpose: input.purpose },
      create: {
        purpose: input.purpose,
        providerId: input.providerId,
        subjectTemplate: input.subjectTemplate,
        bodyTemplate: input.bodyTemplate,
        bodyFormat: input.bodyFormat,
        active: input.active,
      },
      update: {
        providerId: input.providerId,
        subjectTemplate: input.subjectTemplate,
        bodyTemplate: input.bodyTemplate,
        bodyFormat: input.bodyFormat,
        active: input.active,
      },
    });
    return mapRoute(row);
  }

  async createOutbox(input: CreateOutboxInput): Promise<EmailOutboxItem> {
    const row = await prisma.emailOutbox.create({
      data: {
        purpose: input.purpose,
        providerId: input.providerId,
        toEmail: input.toEmail,
        subject: input.subject,
        body: input.body,
        format: input.format,
        status: "PENDING",
        variables: input.variables,
      },
    });
    return mapOutbox(row);
  }

  async markOutboxSent(id: string): Promise<void> {
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: "SENT",
        error: null,
        sentAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }

  async markOutboxFailed(id: string, error: string): Promise<void> {
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: "FAILED",
        error,
        attempts: { increment: 1 },
      },
    });
  }

  async listOutbox(limit = 50): Promise<EmailOutboxItem[]> {
    const rows = await prisma.emailOutbox.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapOutbox);
  }

  async findOutbox(id: string): Promise<EmailOutboxItem | null> {
    const row = await prisma.emailOutbox.findUnique({ where: { id } });
    return row ? mapOutbox(row) : null;
  }
}

function mapProvider(row: {
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
}): EmailProvider {
  return row;
}

function mapRoute(row: {
  id: string;
  purpose: string;
  providerId: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  bodyFormat: "HTML" | "TEXT";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): EmailPurposeRoute {
  return row;
}

function mapOutbox(row: {
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
  variables: unknown;
  sentAt: Date | null;
  createdAt: Date;
}): EmailOutboxItem {
  return {
    ...row,
    variables: asStringRecord(row.variables),
  };
}

function asStringRecord(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return Object.keys(result).length ? result : null;
}
