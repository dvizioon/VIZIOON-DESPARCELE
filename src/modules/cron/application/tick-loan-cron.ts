import { autoPayDueLoanInstallments } from "@/modules/debt/application/auto-pay-loan-installments";
import { generateRecurringInstallments } from "@/modules/debt/application/generate-recurring-installments";
import { sendInstallmentReminders } from "@/modules/debt/application/send-installment-reminders";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import { PrismaMailRepository } from "@/modules/mail/infrastructure/prisma-mail-repository";
import { prisma } from "@/shared/infrastructure/prisma";
import type { CronTaskType } from "@prisma/client";
import { daysBack, scheduledAt, toRunDate } from "./loan-cron-date";

const CATCH_UP_DAYS = 14;

export type TickLoanCronResult = {
  enqueued: number;
  processed: number;
  paidTotal: number;
  createdTotal: number;
  reminderTotal: number;
  skippedProcess: boolean;
};

type CronConfig = {
  loanEnabled: boolean;
  loanHour: number;
  recurringEnabled: boolean;
  recurringHour: number;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderDaysBefore: number;
};

async function getCronConfig(): Promise<CronConfig> {
  const row = await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return {
    loanEnabled: row.loanCronEnabled,
    loanHour: Math.min(23, Math.max(0, row.loanCronHour)),
    recurringEnabled: row.recurringCronEnabled,
    recurringHour: Math.min(23, Math.max(0, row.recurringCronHour)),
    reminderEnabled: row.reminderCronEnabled,
    reminderHour: Math.min(23, Math.max(0, row.reminderCronHour)),
    reminderDaysBefore: Math.min(7, Math.max(1, row.reminderDaysBefore)),
  };
}

async function enqueueType(
  type: CronTaskType,
  hour: number,
  now: Date,
): Promise<number> {
  let enqueued = 0;
  for (const day of daysBack(now, CATCH_UP_DAYS)) {
    const when = scheduledAt(day, hour);
    if (when > now) {
      continue;
    }
    const runDate = toRunDate(day);
    try {
      await prisma.cronTask.create({
        data: {
          type,
          status: "PENDING",
          runDate,
          scheduledFor: when,
        },
      });
      enqueued += 1;
    } catch {
      // já existe
    }
  }
  return enqueued;
}

export async function enqueueDueLoanCronTasks(now = new Date()): Promise<number> {
  const config = await getCronConfig();
  let enqueued = 0;
  enqueued += await enqueueType("LOAN_AUTO_PAY", config.loanHour, now);
  enqueued += await enqueueType("RECURRING_GENERATE", config.recurringHour, now);
  enqueued += await enqueueType("INSTALLMENT_REMINDER", config.reminderHour, now);
  return enqueued;
}

function asOfEndOfDay(scheduledFor: Date): Date {
  return new Date(
    scheduledFor.getFullYear(),
    scheduledFor.getMonth(),
    scheduledFor.getDate(),
    23,
    59,
    59,
    999,
  );
}

async function processOneTask(
  taskId: string,
  type: CronTaskType,
  asOf: Date,
  daysBefore: number,
): Promise<{ paid: number; created: number; reminded: number }> {
  await prisma.cronTask.update({
    where: { id: taskId },
    data: { status: "RUNNING", startedAt: new Date(), error: null },
  });

  try {
    let paid = 0;
    let created = 0;
    let reminded = 0;
    let message = "";

    if (type === "LOAN_AUTO_PAY") {
      const result = await autoPayDueLoanInstallments(asOf);
      paid = result.paidCount;
      message =
        paid > 0
          ? `${paid} parcela(s) marcada(s) como paga`
          : "Nenhuma parcela pendente de baixa automática";
    } else if (type === "RECURRING_GENERATE") {
      const result = await generateRecurringInstallments(new PrismaDebtRepository(), asOf);
      created = result.createdCount;
      message =
        created > 0
          ? `${created} parcela(s) recorrente(s) gerada(s)`
          : "Nenhuma parcela recorrente nova";
    } else {
      const result = await sendInstallmentReminders(
        new PrismaMailRepository(),
        daysBefore,
        asOf,
      );
      reminded = result.beforeCount + result.overdueCount;
      message = `${result.beforeCount} aviso(s) de vencimento · ${result.overdueCount} atraso(s)`;
    }

    await prisma.cronTask.update({
      where: { id: taskId },
      data: {
        status: "DONE",
        finishedAt: new Date(),
        paidCount: paid || created || reminded || null,
        message,
      },
    });

    return { paid, created, reminded };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Falha ao processar tarefa";
    await prisma.cronTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: errMessage,
      },
    });
    throw error;
  }
}

export async function processPendingLoanCronTasks(options?: {
  force?: boolean;
  limit?: number;
}): Promise<{
  processed: number;
  paidTotal: number;
  createdTotal: number;
  reminderTotal: number;
  skipped: boolean;
}> {
  const config = await getCronConfig();
  const force = Boolean(options?.force);

  const types: CronTaskType[] = [];
  if (config.loanEnabled || force) {
    types.push("LOAN_AUTO_PAY");
  }
  if (config.recurringEnabled || force) {
    types.push("RECURRING_GENERATE");
  }
  if (config.reminderEnabled || force) {
    types.push("INSTALLMENT_REMINDER");
  }

  if (types.length === 0) {
    return {
      processed: 0,
      paidTotal: 0,
      createdTotal: 0,
      reminderTotal: 0,
      skipped: true,
    };
  }

  const pending = await prisma.cronTask.findMany({
    where: { type: { in: types }, status: "PENDING" },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    take: options?.limit ?? 50,
  });

  let processed = 0;
  let paidTotal = 0;
  let createdTotal = 0;
  let reminderTotal = 0;

  for (const task of pending) {
    if (task.type === "LOAN_AUTO_PAY" && !config.loanEnabled && !force) {
      continue;
    }
    if (task.type === "RECURRING_GENERATE" && !config.recurringEnabled && !force) {
      continue;
    }
    if (task.type === "INSTALLMENT_REMINDER" && !config.reminderEnabled && !force) {
      continue;
    }

    try {
      const result = await processOneTask(
        task.id,
        task.type,
        asOfEndOfDay(task.scheduledFor),
        config.reminderDaysBefore,
      );
      paidTotal += result.paid;
      createdTotal += result.created;
      reminderTotal += result.reminded;
      processed += 1;
    } catch (error) {
      console.error(`[cron] tarefa ${task.id} falhou`, error);
      processed += 1;
    }
  }

  return {
    processed,
    paidTotal,
    createdTotal,
    reminderTotal,
    skipped: false,
  };
}

export async function retryCronTask(
  taskId: string,
): Promise<{ paidCount: number; createdCount: number; reminderCount: number }> {
  const task = await prisma.cronTask.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new Error("Tarefa não encontrada");
  }

  const config = await getCronConfig();

  await prisma.cronTask.update({
    where: { id: taskId },
    data: { status: "PENDING", error: null, message: null, finishedAt: null, startedAt: null },
  });

  const result = await processOneTask(
    taskId,
    task.type,
    asOfEndOfDay(task.scheduledFor),
    config.reminderDaysBefore,
  );

  return {
    paidCount: result.paid,
    createdCount: result.created,
    reminderCount: result.reminded,
  };
}

export async function tickLoanCron(options?: {
  forceProcess?: boolean;
}): Promise<TickLoanCronResult> {
  const enqueued = await enqueueDueLoanCronTasks();
  const { processed, paidTotal, createdTotal, reminderTotal, skipped } =
    await processPendingLoanCronTasks({
      force: options?.forceProcess,
    });
  return {
    enqueued,
    processed,
    paidTotal,
    createdTotal,
    reminderTotal,
    skippedProcess: skipped,
  };
}
