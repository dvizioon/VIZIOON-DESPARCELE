import { notFound } from "next/navigation";
import { InstallmentActions } from "@/components/forms/installment-actions";
import { NoteComposer } from "@/components/notes/note-composer";
import { NoteList } from "@/components/notes/note-list";
import { DebtSettingsModal } from "@/components/debt/debt-settings-modal";
import { InstallmentsBatchModal } from "@/components/debt/installments-batch-modal";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { isDebtHidden, isDebtVisibleTo } from "@/modules/debt/domain/debt";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import {
  remainingAmountCents,
  remainingInstallments,
} from "@/modules/installment/domain/installment";
import { PrismaNoteRepository } from "@/modules/note/infrastructure/prisma-note-repository";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { canEditContent, isAdmin } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";
import { formatDateFull, toCalendarInputValue } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

type DebtDetailPageProps = {
  params: Promise<{ workspaceId: string; debtId: string }>;
};

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const { workspaceId, debtId } = await params;
  const user = await requireUser();
  const access = await requireWorkspaceAccess(
    workspaceId,
    user.id,
    new PrismaWorkspaceRepository(),
  );

  if (!access.ok) {
    notFound();
  }

  const debt = await new PrismaDebtRepository().findById(debtId);
  if (!debt || debt.workspaceId !== workspaceId) {
    notFound();
  }

  const admin = isAdmin(access.value.member);
  if (!isDebtVisibleTo(debt, user.id, admin)) {
    notFound();
  }

  const notes = await new PrismaNoteRepository().listByDebt(debtId);
  const shared = access.value.workspace.type === "SHARED";
  const canEdit = canEditContent(access.value.member);
  const remaining = remainingAmountCents(debt.installments);
  const remainingCount = remainingInstallments(debt.installments);
  const paidCount = debt.installmentCount - remainingCount;
  const paidCents = debt.installments
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const progress = Math.round((paidCount / debt.installmentCount) * 100);
  const members = access.value.members.map((item) => ({
    userId: item.userId,
    userName: item.userName,
  }));

  return (
    <Reveal className="space-y-5">
      <div className="sheet" data-reveal>
        <p className="text-sm text-ink/55">{shared ? debt.ownerName : "Sua dívida"}</p>
        <div className="mt-1 flex min-w-0 items-center gap-1">
          <h2 className="min-w-0 truncate font-display text-3xl sm:text-4xl">{debt.name}</h2>
          {canEdit ? (
            <DebtSettingsModal
              autoPay={debt.autoPay}
              canManageVisibility={admin}
              currentUserId={user.id}
              debtId={debtId}
              debtName={debt.name}
              hideMode={debt.hideMode}
              hiddenUserIds={debt.hiddenUserIds}
              kind={debt.kind}
              members={members}
              recurringPaused={debt.recurringPausedAt != null}
              remindersEnabled={debt.remindersEnabled}
              shared={shared}
              workspaceId={workspaceId}
            />
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {debt.kind === "RECURRING" ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pine-soft px-2.5 py-1 text-xs font-medium text-pine-dark">
              <AppIcon name="tabler:repeat" className="size-3.5" />
              {debt.recurringPausedAt ? "Recorrente pausada" : "Recorrente"}
            </p>
          ) : null}
          {debt.kind === "VARIABLE" ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pine-soft px-2.5 py-1 text-xs font-medium text-pine-dark">
              <AppIcon name="tabler:chart-dots" className="size-3.5" />
              {debt.recurringPausedAt ? "Variável pausada" : "Mensal variável"}
            </p>
          ) : null}
          {debt.autoPay ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pine-soft px-2.5 py-1 text-xs font-medium text-pine-dark">
              <AppIcon name="tabler:building-bank" className="size-3.5" />
              Baixa automática
            </p>
          ) : null}
          {debt.remindersEnabled ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70">
              <AppIcon name="tabler:mail" className="size-3.5" />
              Aviso por e-mail
            </p>
          ) : null}
          {admin && isDebtHidden(debt) ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70">
              <AppIcon name="tabler:eye-off" className="size-3.5" />
              {debt.hideMode === "ALL" ? "Oculta para o restante" : "Oculta para algumas pessoas"}
            </p>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={formatBRL(debt.totalAmountCents)} />
          <Metric
            label="Já pago"
            value={formatBRL(paidCents)}
            hint={`${paidCount} parcela${paidCount === 1 ? "" : "s"}`}
          />
          <Metric
            label="Ainda falta"
            value={formatBRL(remaining)}
            hint={`${remainingCount} em aberto`}
          />
          <Metric label="Progresso" value={`${progress}%`} />
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="progress-fill h-full rounded-full bg-pine"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <section className="sheet space-y-4" data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl">Notas</h3>
          {canEdit ? <NoteComposer debtId={debtId} workspaceId={workspaceId} /> : null}
        </div>
        <NoteList
          canManage={isAdmin(access.value.member)}
          currentUserId={user.id}
          debtId={debtId}
          notes={notes.map((note) => ({
            id: note.id,
            authorId: note.authorId,
            authorName: note.authorName,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            attachments: note.attachments,
          }))}
          workspaceId={workspaceId}
        />
      </section>

      <section className="space-y-3" data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl">Parcelas</h3>
          {canEdit ? (
            <InstallmentsBatchModal
              debtId={debtId}
              installments={debt.installments.map((item) => ({
                id: item.id,
                number: item.number,
                amountCents: item.amountCents,
                dueDate: toCalendarInputValue(item.dueDate),
                status: item.status,
              }))}
              workspaceId={workspaceId}
            />
          ) : null}
        </div>

        <ul className="grid gap-3">
          {debt.installments.map((item) => {
            const paid = item.status === "PAID";

            return (
              <li className="sheet" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <AppIcon
                        name={paid ? "tabler:circle-check" : "tabler:clock"}
                        className={paid ? "size-5 text-moss" : "size-5 text-clay"}
                      />
                      Parcela {item.number}
                      <MonthBadge date={item.dueDate} />
                    </p>
                    <p className="mt-1 text-sm text-ink/55">Vence {formatDateFull(item.dueDate)}</p>
                    {paid ? (
                      <p className="mt-1 text-sm text-moss">
                        Paga por {item.paidByName ?? "alguem"}
                        {item.paidAt ? ` em ${formatDateFull(item.paidAt)}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-display text-2xl">{formatBRL(item.amountCents)}</p>
                </div>

                {canEdit ? (
                  <InstallmentActions
                    canDelete={debt.installments.length > 1}
                    debtId={debtId}
                    installmentId={item.id}
                    paid={paid}
                    receiptUrl={item.receiptUrl}
                    reminderDisabled={item.reminderDisabled}
                    remindersOnDebt={debt.remindersEnabled}
                    workspaceId={workspaceId}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </Reveal>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-sm text-ink/50">{label}</p>
      <p className="font-display text-2xl">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink/45">{hint}</p> : null}
    </div>
  );
}
