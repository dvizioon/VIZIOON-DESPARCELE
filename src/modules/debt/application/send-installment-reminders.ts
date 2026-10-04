import { dispatchMail } from "@/modules/mail/application/dispatch-mail";
import type { MailRepository } from "@/modules/mail/domain/mail-repository";
import { calendarDate, formatDateFull } from "@/shared/utils/date";
import { formatBRL, toCents } from "@/shared/utils/money";
import { prisma } from "@/shared/infrastructure/prisma";

export type ReminderCronResult = {
  beforeCount: number;
  overdueCount: number;
};

function dayBounds(year: number, monthIndex: number, day: number) {
  const start = calendarDate(year, monthIndex, day);
  const end = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999));
  return { start, end };
}

export async function sendInstallmentReminders(
  mail: MailRepository,
  daysBefore: number,
  asOf = new Date(),
): Promise<ReminderCronResult> {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const d = asOf.getDate();
  const safeDays = Math.min(7, Math.max(1, daysBefore));

  const target = dayBounds(y, m, d + safeDays);
  const todayStart = calendarDate(y, m, d);

  let beforeCount = 0;
  let overdueCount = 0;

  const upcoming = await prisma.installment.findMany({
    where: {
      status: "PENDING",
      reminderDisabled: false,
      reminderSentAt: null,
      dueDate: { gte: target.start, lte: target.end },
      debt: { remindersEnabled: true },
    },
    include: {
      debt: {
        include: {
          owner: true,
          workspace: true,
        },
      },
    },
  });

  for (const item of upcoming) {
    const sent = await sendOne(mail, item, "vence_em");
    if (sent) {
      await prisma.installment.update({
        where: { id: item.id },
        data: { reminderSentAt: new Date() },
      });
      beforeCount += 1;
    }
  }

  const overdue = await prisma.installment.findMany({
    where: {
      status: "PENDING",
      reminderDisabled: false,
      overdueReminderSentAt: null,
      dueDate: { lt: todayStart },
      debt: { remindersEnabled: true },
    },
    include: {
      debt: {
        include: {
          owner: true,
          workspace: true,
        },
      },
    },
  });

  for (const item of overdue) {
    const sent = await sendOne(mail, item, "atrasada");
    if (sent) {
      await prisma.installment.update({
        where: { id: item.id },
        data: { overdueReminderSentAt: new Date() },
      });
      overdueCount += 1;
    }
  }

  return { beforeCount, overdueCount };
}

async function sendOne(
  mail: MailRepository,
  item: {
    id: string;
    number: number;
    amount: { toString(): string };
    dueDate: Date;
    debt: {
      id: string;
      name: string;
      workspaceId: string;
      owner: { name: string; email: string };
      workspace: { name: string };
    };
  },
  motivo: "vence_em" | "atrasada",
): Promise<boolean> {
  const amountCents = toCents(item.amount.toString());
  const result = await dispatchMail(
    "installment_reminder",
    item.debt.owner.email,
    {
      nome: item.debt.owner.name,
      email: item.debt.owner.email,
      workspace: item.debt.workspace.name,
      divida: item.debt.name,
      parcela: String(item.number),
      valor: formatBRL(amountCents),
      vencimento: formatDateFull(item.dueDate),
      data: formatDateFull(new Date()),
      motivo: motivo === "atrasada" ? "atrasada" : "vence em breve",
      link: `/w/${item.debt.workspaceId}/debts/${item.debt.id}`,
    },
    mail,
  );

  if (!result.ok) {
    console.error(`[reminder] falha parcela ${item.id}:`, result.error.message);
    return false;
  }

  return true;
}
