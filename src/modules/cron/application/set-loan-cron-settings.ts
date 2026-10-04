import { fail, ok, type Result } from "@/shared/types/result";
import { prisma } from "@/shared/infrastructure/prisma";
import type { LoanCronSettings } from "../domain/loan-cron";

export async function setLoanCronEnabled(enabled: boolean): Promise<Result<LoanCronSettings>> {
  const row = await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", loanCronEnabled: enabled },
    update: { loanCronEnabled: enabled },
  });

  return ok({
    enabled: row.loanCronEnabled,
    hour: row.loanCronHour,
    updatedAt: row.updatedAt,
  });
}

export async function setLoanCronHour(hour: number): Promise<Result<LoanCronSettings>> {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return fail("INVALID_HOUR", "Hora inválida (use 0 a 23)");
  }

  const row = await prisma.systemConfig.upsert({
    where: { id: "default" },
    create: { id: "default", loanCronHour: hour },
    update: { loanCronHour: hour },
  });

  return ok({
    enabled: row.loanCronEnabled,
    hour: row.loanCronHour,
    updatedAt: row.updatedAt,
  });
}
