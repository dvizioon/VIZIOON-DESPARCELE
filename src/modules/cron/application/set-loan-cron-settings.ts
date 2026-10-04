import { fail, ok, type Result } from "@/shared/types/result";
import { prisma } from "@/shared/infrastructure/prisma";
import type { SystemCronSettings } from "../domain/loan-cron";

async function readSettings(): Promise<SystemCronSettings> {
  const row = await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return {
    loan: {
      enabled: row.loanCronEnabled,
      hour: row.loanCronHour,
      updatedAt: row.updatedAt,
    },
    recurring: {
      enabled: row.recurringCronEnabled,
      hour: row.recurringCronHour,
    },
    reminder: {
      enabled: row.reminderCronEnabled,
      hour: row.reminderCronHour,
      daysBefore: row.reminderDaysBefore,
    },
    updatedAt: row.updatedAt,
  };
}

export async function setLoanCronEnabled(enabled: boolean): Promise<Result<SystemCronSettings>> {
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", loanCronEnabled: enabled },
    update: { loanCronEnabled: enabled },
  });
  return ok(await readSettings());
}

export async function setLoanCronHour(hour: number): Promise<Result<SystemCronSettings>> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return fail("INVALID_HOUR", "Hora inválida (use 0 a 23)");
  }
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", loanCronHour: hour },
    update: { loanCronHour: hour },
  });
  return ok(await readSettings());
}

export async function setRecurringCronEnabled(
  enabled: boolean,
): Promise<Result<SystemCronSettings>> {
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", recurringCronEnabled: enabled },
    update: { recurringCronEnabled: enabled },
  });
  return ok(await readSettings());
}

export async function setRecurringCronHour(hour: number): Promise<Result<SystemCronSettings>> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return fail("INVALID_HOUR", "Hora inválida (use 0 a 23)");
  }
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", recurringCronHour: hour },
    update: { recurringCronHour: hour },
  });
  return ok(await readSettings());
}

export async function setReminderCronEnabled(
  enabled: boolean,
): Promise<Result<SystemCronSettings>> {
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", reminderCronEnabled: enabled },
    update: { reminderCronEnabled: enabled },
  });
  return ok(await readSettings());
}

export async function setReminderCronHour(hour: number): Promise<Result<SystemCronSettings>> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return fail("INVALID_HOUR", "Hora inválida (use 0 a 23)");
  }
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", reminderCronHour: hour },
    update: { reminderCronHour: hour },
  });
  return ok(await readSettings());
}

export async function setReminderDaysBefore(days: number): Promise<Result<SystemCronSettings>> {
  if (!Number.isInteger(days) || days < 1 || days > 7) {
    return fail("INVALID_DAYS", "Dias antes entre 1 e 7");
  }
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", reminderDaysBefore: days },
    update: { reminderDaysBefore: days },
  });
  return ok(await readSettings());
}
