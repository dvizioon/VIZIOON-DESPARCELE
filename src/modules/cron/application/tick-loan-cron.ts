import { autoPayDueLoanInstallments } from "@/modules/debt/application/auto-pay-loan-installments";
import { prisma } from "@/shared/infrastructure/prisma";
import { daysBack, scheduledAt, toRunDate } from "./loan-cron-date";

const CATCH_UP_DAYS = 14;

export type TickLoanCronResult = {
  enqueued: number;
  processed: number;
  paidTotal: number;
  skippedProcess: boolean;
};

async function getLoanCronConfig() {
  const row = await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return {
    enabled: row.loanCronEnabled,
    hour: Math.min(23, Math.max(0, row.loanCronHour)),
  };
}

export async function enqueueDueLoanCronTasks(now = new Date()): Promise<number> {
  const { hour } = await getLoanCronConfig();
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
          type: "LOAN_AUTO_PAY",
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

async function processOneTask(taskId: string, asOf: Date) {
  await prisma.cronTask.update({
    where: { id: taskId },
    data: { status: "RUNNING", startedAt: new Date(), error: null },
  });

  try {
    const result = await autoPayDueLoanInstallments(asOf);
    await prisma.cronTask.update({
      where: { id: taskId },
      data: {
        status: "DONE",
        finishedAt: new Date(),
        paidCount: result.paidCount,
        message:
          result.paidCount > 0
            ? `${result.paidCount} parcela(s) marcada(s) como paga`
            : "Nenhuma parcela pendente de empréstimo",
      },
    });
    return result.paidCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar tarefa";
    await prisma.cronTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: message,
      },
    });
    throw error;
  }
}

export async function processPendingLoanCronTasks(options?: {
  force?: boolean;
  limit?: number;
}): Promise<{ processed: number; paidTotal: number; skipped: boolean }> {
  const { enabled } = await getLoanCronConfig();
  if (!enabled && !options?.force) {
    return { processed: 0, paidTotal: 0, skipped: true };
  }

  const pending = await prisma.cronTask.findMany({
    where: { type: "LOAN_AUTO_PAY", status: "PENDING" },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    take: options?.limit ?? 50,
  });

  let processed = 0;
  let paidTotal = 0;

  for (const task of pending) {
    const asOf = new Date(
      task.scheduledFor.getFullYear(),
      task.scheduledFor.getMonth(),
      task.scheduledFor.getDate(),
      23,
      59,
      59,
      999,
    );
    try {
      paidTotal += await processOneTask(task.id, asOf);
      processed += 1;
    } catch (error) {
      console.error(`[loan-cron] tarefa ${task.id} falhou`, error);
      processed += 1;
    }
  }

  return { processed, paidTotal, skipped: false };
}

export async function retryCronTask(taskId: string): Promise<{ paidCount: number }> {
  const task = await prisma.cronTask.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "LOAN_AUTO_PAY") {
    throw new Error("Tarefa não encontrada");
  }

  await prisma.cronTask.update({
    where: { id: taskId },
    data: { status: "PENDING", error: null, message: null, finishedAt: null, startedAt: null },
  });

  const asOf = new Date(
    task.scheduledFor.getFullYear(),
    task.scheduledFor.getMonth(),
    task.scheduledFor.getDate(),
    23,
    59,
    59,
    999,
  );
  const paidCount = await processOneTask(taskId, asOf);
  return { paidCount };
}

export async function tickLoanCron(options?: { forceProcess?: boolean }): Promise<TickLoanCronResult> {
  const enqueued = await enqueueDueLoanCronTasks();
  const { processed, paidTotal, skipped } = await processPendingLoanCronTasks({
    force: options?.forceProcess,
  });
  return {
    enqueued,
    processed,
    paidTotal,
    skippedProcess: skipped,
  };
}
