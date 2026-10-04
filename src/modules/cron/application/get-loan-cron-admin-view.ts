import { prisma } from "@/shared/infrastructure/prisma";
import type {
  CronQueueSummary,
  CronTaskView,
  SystemCronSettings,
} from "../domain/loan-cron";

export type LoanCronAdminView = {
  settings: SystemCronSettings;
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
    prisma.cronTask.count({ where: { status: "PENDING" } }),
    prisma.cronTask.count({ where: { status: "RUNNING" } }),
    prisma.cronTask.count({ where: { status: "DONE" } }),
    prisma.cronTask.count({ where: { status: "FAILED" } }),
    prisma.cronTask.findMany({
      orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      take: 60,
    }),
  ]);

  return {
    settings: {
      loan: {
        enabled: config.loanCronEnabled,
        hour: config.loanCronHour,
        updatedAt: config.updatedAt,
      },
      recurring: {
        enabled: config.recurringCronEnabled,
        hour: config.recurringCronHour,
      },
      reminder: {
        enabled: config.reminderCronEnabled,
        hour: config.reminderCronHour,
        daysBefore: config.reminderDaysBefore,
      },
      updatedAt: config.updatedAt,
    },
    summary: { pending, running, done, failed },
    tasks: rows.map((row) => ({
      id: row.id,
      type: row.type,
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
