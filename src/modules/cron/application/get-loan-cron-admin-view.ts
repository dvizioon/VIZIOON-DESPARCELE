import { prisma } from "@/shared/infrastructure/prisma";
import type { CronQueueSummary, CronTaskView, LoanCronSettings } from "../domain/loan-cron";

export type LoanCronAdminView = {
  settings: LoanCronSettings;
  summary: CronQueueSummary;
  tasks: CronTaskView[];
};

export async function getLoanCronAdminView(): Promise<LoanCronAdminView> {
  const [config, pending, running, done, failed, rows] = await Promise.all([
    prisma.systemConfig.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    }),
    prisma.cronTask.count({ where: { type: "LOAN_AUTO_PAY", status: "PENDING" } }),
    prisma.cronTask.count({ where: { type: "LOAN_AUTO_PAY", status: "RUNNING" } }),
    prisma.cronTask.count({ where: { type: "LOAN_AUTO_PAY", status: "DONE" } }),
    prisma.cronTask.count({ where: { type: "LOAN_AUTO_PAY", status: "FAILED" } }),
    prisma.cronTask.findMany({
      where: { type: "LOAN_AUTO_PAY" },
      orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      take: 40,
    }),
  ]);

  return {
    settings: {
      enabled: config.loanCronEnabled,
      hour: config.loanCronHour,
      updatedAt: config.updatedAt,
    },
    summary: { pending, running, done, failed },
    tasks: rows.map((row) => ({
      id: row.id,
      type: "LOAN_AUTO_PAY" as const,
      status: row.status,
      runDate: row.runDate,
      scheduledFor: row.scheduledFor,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      paidCount: row.paidCount,
      message: row.message,
      error: row.error,
      createdAt: row.createdAt,
    })),
  };
}
