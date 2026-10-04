import Link from "next/link";
import { notFound } from "next/navigation";
import { CreateDebtModal } from "@/components/forms/create-debt-modal";
import { firstName } from "@/modules/auth/domain/user";
import { toDebtCard } from "@/modules/debt/application/get-dashboard";
import { listDebts } from "@/modules/debt/application/list-debts";
import type { DebtOwnerFilter } from "@/modules/debt/domain/debt";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";
import { addMonths, formatDate, toDateInputValue } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";
import { AppIcon } from "@/components/ui/icon";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";

type DebtsPageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ view?: string; status?: string }>;
};

export default async function DebtsPage({ params, searchParams }: DebtsPageProps) {
  const { workspaceId } = await params;
  const { view, status } = await searchParams;
  const user = await requireUser();
  const workspaces = new PrismaWorkspaceRepository();
  const access = await requireWorkspaceAccess(workspaceId, user.id, workspaces);

  if (!access.ok) {
    notFound();
  }

  const filter = parseFilter(view);
  const statusFilter = parseStatus(status);
  const result = await listDebts(
    workspaceId,
    user.id,
    filter,
    new PrismaDebtRepository(),
    workspaces,
  );

  if (!result.ok) {
    notFound();
  }

  const { workspace, members } = access.value;
  const shared = workspace.type === "SHARED";
  const other = members.find((member) => member.userId !== user.id);
  const theirsLabel = other && members.length === 2 ? firstName(other.userName) : "Outras";
  const cards = result.value
    .map(toDebtCard)
    .filter((debt) => {
      if (statusFilter === "open") {
        return debt.remainingCount > 0;
      }

      if (statusFilter === "done") {
        return debt.remainingCount === 0;
      }

      return true;
    });

  return (
    <Reveal className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3" data-reveal>
        <h2 className="font-display text-3xl">Dívidas</h2>
        {canEditContent(access.value.member) ? (
          <CreateDebtModal
            currentUserId={user.id}
            defaultDueDate={toDateInputValue(addMonths(new Date(), 1))}
            members={members.map((item) => ({
              userId: item.userId,
              userName: item.userName,
              userEmail: item.userEmail,
            }))}
            shared={shared}
            triggerLabel="Nova dívida"
            workspaceId={workspaceId}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" data-reveal>
        {shared ? (
          <FilterPills watch={`owner-${filter}`}>
            <FilterLink href={`/w/${workspaceId}/debts?view=mine&status=${statusFilter}`} active={filter === "mine"}>
              Minhas
            </FilterLink>
            <FilterLink
              href={`/w/${workspaceId}/debts?view=theirs&status=${statusFilter}`}
              active={filter === "theirs"}
            >
              {theirsLabel}
            </FilterLink>
            <FilterLink href={`/w/${workspaceId}/debts?view=all&status=${statusFilter}`} active={filter === "all"}>
              Todas
            </FilterLink>
          </FilterPills>
        ) : null}
        <FilterPills watch={`status-${statusFilter}`}>
          <FilterLink href={`/w/${workspaceId}/debts?view=${filter}&status=open`} active={statusFilter === "open"}>
            Abertas
          </FilterLink>
          <FilterLink href={`/w/${workspaceId}/debts?view=${filter}&status=done`} active={statusFilter === "done"}>
            Quitadas
          </FilterLink>
          <FilterLink href={`/w/${workspaceId}/debts?view=${filter}&status=all`} active={statusFilter === "all"}>
            Todas
          </FilterLink>
        </FilterPills>
      </div>

      {cards.length === 0 ? (
        <div className="sheet flex items-center gap-3 text-ink/60" data-reveal>
          <AppIcon name="tabler:notes-off" className="size-5" />
          Nenhuma dívida neste filtro
        </div>
      ) : (
        <ul className="grid gap-3">
          {cards.map((debt) => {
            const paidCount = debt.installmentCount - debt.remainingCount;
            const progress = Math.round((paidCount / debt.installmentCount) * 100);
            const overdue =
              Boolean(debt.nextDueDate) && new Date(debt.nextDueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

            return (
              <li data-reveal key={debt.id}>
                <Link
                  className="sheet block"
                  href={`/w/${workspaceId}/debts/${debt.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-2xl">{debt.name}</p>
                      <p className="mt-1 text-sm text-ink/55">
                        {shared ? `${debt.ownerName} · ` : ""}
                        cadastro de {debt.createdByName}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {debt.nextDueDate ? (
                          <>
                            <DebtBadge icon="tabler:cash" tone="pine">
                              Vai pagar {formatBRL(debt.nextAmountCents)}
                            </DebtBadge>
                            <DebtBadge icon="tabler:calendar-due" tone={overdue ? "clay" : "plain"}>
                              {overdue ? "Atrasada " : ""}
                              {formatDate(debt.nextDueDate)}
                            </DebtBadge>
                          </>
                        ) : (
                          <DebtBadge icon="tabler:circle-check" tone="pine">
                            Tudo pago
                          </DebtBadge>
                        )}
                        <DebtBadge icon="tabler:layers-subtract" tone="plain">
                          {paidCount}/{debt.installmentCount} paga{paidCount === 1 ? "" : "s"}
                        </DebtBadge>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <AmountTag
                        hint={`${debt.installmentCount}x de ${formatBRL(
                          Math.round(debt.totalAmountCents / Math.max(debt.installmentCount, 1)),
                        )}`}
                        label="Total"
                        muted
                        value={formatBRL(debt.totalAmountCents)}
                      />
                      <AmountTag
                        highlight
                        hint={
                          debt.remainingCents === 0
                            ? "Tudo pago"
                            : `${debt.remainingCount} em aberto`
                        }
                        label={debt.remainingCents === 0 ? "Quitada" : "Restante"}
                        value={formatBRL(debt.remainingCents)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="usage-track relative h-3 overflow-hidden rounded-full">
                      <div
                        className="progress-fill h-full rounded-full bg-gradient-to-r from-pine via-[#148576] to-moss"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink/45">{progress}% do total</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Reveal>
  );
}

function parseFilter(value: string | undefined): DebtOwnerFilter {
  if (value === "mine" || value === "theirs") {
    return value;
  }

  return "all";
}

function parseStatus(value: string | undefined): "open" | "done" | "all" {
  if (value === "done" || value === "all") {
    return value;
  }

  return "open";
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={`nav-link relative z-10 shrink-0 ${active ? "text-ink" : ""}`}
      data-pill-active={active ? "true" : "false"}
      href={href}
    >
      {children}
    </Link>
  );
}

function AmountTag({
  label,
  value,
  hint,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  const tone = highlight
    ? "bg-pine-soft ring-pine/15 text-pine-dark"
    : muted
      ? "bg-paper ring-line/80 text-ink/80"
      : "bg-white ring-line";

  return (
    <div className={`min-w-[7.5rem] rounded-2xl px-3 py-2 ring-1 ${tone}`}>
      <p className="text-[11px] uppercase tracking-wide text-ink/45">{label}</p>
      <p className="font-display text-xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-ink/40">{hint}</p>
    </div>
  );
}

function DebtBadge({
  icon,
  children,
  tone = "plain",
}: {
  icon: string;
  children: React.ReactNode;
  tone?: "plain" | "pine" | "clay";
}) {
  const toneClass =
    tone === "pine"
      ? "bg-pine-soft text-pine-dark"
      : tone === "clay"
        ? "bg-clay/10 text-clay"
        : "bg-white text-ink/70 ring-1 ring-line";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      <AppIcon name={icon} className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}
