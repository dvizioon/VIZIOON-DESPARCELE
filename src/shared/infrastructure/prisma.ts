import { PrismaClient } from "@prisma/client";
import { ensureDatabaseUrl } from "@/shared/config/database-url";

const databaseUrl = ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isCurrentClient(client: PrismaClient | undefined): client is PrismaClient {
  if (typeof client?.emailProvider?.findMany !== "function") {
    return false;
  }

  const models = (
    client as unknown as {
      _runtimeDataModel?: { models?: Record<string, { fields?: Record<string, unknown> }> };
    }
  )._runtimeDataModel?.models;

  return Boolean(models?.User?.fields?.disabledAt);
}

const existing = globalForPrisma.prisma;
export const prisma = isCurrentClient(existing) ? existing : createPrismaClient();

if (existing && existing !== prisma) {
  void existing.$disconnect();
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
