import { existsSync } from "fs";
import { hash } from "bcryptjs";
import { PrismaClient, type WorkspaceType } from "@prisma/client";
import { generateInstallments } from "../src/modules/installment/domain/generate-installments";
import { ensureDatabaseUrl } from "../src/shared/config/database-url";
import { centsToDecimalString } from "../src/shared/utils/money";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databaseUrl = ensureDatabaseUrl();
const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function main(): Promise<void> {
  console.warn("[seed:demo] Apaga usuários, espaços e dívidas. NÃO use em produção.");

  const adminEmail = process.env.SEED_MASTER_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? "admin@admin.com";
  const adminPassword =
    process.env.SEED_MASTER_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.SEED_MASTER_NAME ?? process.env.SEED_ADMIN_NAME ?? "Admin";

  await prisma.installment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash: await hash(adminPassword, 10),
      systemRole: "ADMIN",
    },
  });

  const ana = await prisma.user.create({
    data: {
      name: "Ana Souza",
      email: "ana@desparcele.app",
      passwordHash: await hash("ana12345", 10),
    },
  });

  const casa = await createWorkspace("Casa", "SHARED", admin.id, [ana.id]);
  const pessoal = await createWorkspace("Pessoal", "PERSONAL", admin.id, []);

  const firstDue = thisMonthDue(new Date());

  await createDebt({
    workspaceId: casa.id,
    name: "Cartão Nubank",
    totalCents: 240000,
    count: 8,
    ownerId: admin.id,
    createdById: admin.id,
    firstDue,
  });

  await createDebt({
    workspaceId: casa.id,
    name: "Geladeira",
    totalCents: 360000,
    count: 12,
    ownerId: ana.id,
    createdById: ana.id,
    firstDue,
  });

  await createDebt({
    workspaceId: casa.id,
    name: "Mercado Livre",
    totalCents: 48000,
    count: 3,
    ownerId: admin.id,
    createdById: ana.id,
    firstDue,
  });

  await createDebt({
    workspaceId: pessoal.id,
    name: "Curso",
    totalCents: 90000,
    count: 6,
    ownerId: admin.id,
    createdById: admin.id,
    firstDue,
  });

  const snowball = await prisma.debt.findFirst({
    where: { name: "Mercado Livre" },
    include: { installments: { orderBy: { number: "asc" } } },
  });

  const first = snowball?.installments[0];
  if (first) {
    await prisma.installment.update({
      where: { id: first.id },
      data: {
        status: "PAID",
        paidByUserId: admin.id,
        paidAt: new Date(),
      },
    });
  }

  console.log("Seed ok");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Ana: ana@desparcele.app / ana12345");
}

async function createWorkspace(
  name: string,
  type: WorkspaceType,
  ownerId: string,
  memberIds: string[],
) {
  return prisma.workspace.create({
    data: {
      name,
      type,
      ownerId,
      members: {
        create: [
          { userId: ownerId, role: "ADMIN" },
          ...memberIds.map((userId) => ({ userId, role: "EDITOR" as const })),
        ],
      },
    },
  });
}

async function createDebt(input: {
  workspaceId: string;
  name: string;
  totalCents: number;
  count: number;
  ownerId: string;
  createdById: string;
  firstDue: Date;
}): Promise<void> {
  const installments = generateInstallments(input.totalCents, input.count, input.firstDue);

  await prisma.debt.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      totalAmount: centsToDecimalString(input.totalCents),
      installmentCount: input.count,
      ownerId: input.ownerId,
      createdById: input.createdById,
      installments: {
        create: installments.map((item) => ({
          number: item.number,
          amount: centsToDecimalString(item.amountCents),
          dueDate: item.dueDate,
        })),
      },
    },
  });
}

function thisMonthDue(date: Date): Date {
  const day = Math.min(Math.max(date.getDate(), 5), 25);
  return new Date(date.getFullYear(), date.getMonth(), day);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
