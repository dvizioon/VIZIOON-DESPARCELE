import Link from "next/link";
import { notFound } from "next/navigation";
import { DebtsBoard } from "@/components/debt/debts-board";
import { CreateDebtModal } from "@/components/forms/create-debt-modal";
import { firstName } from "@/modules/auth/domain/user";
import { toDebtCard } from "@/modules/debt/application/get-dashboard";
import { listDebts } from "@/modules/debt/application/list-debts";
import type { DebtOwnerFilter } from "@/modules/debt/domain/debt";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { canEditContent, isAdmin } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";
import { addMonths, toDateInputValue } from "@/shared/utils/date";
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
  const admin = isAdmin(access.value.member);
  const canEdit = canEditContent(access.value.member);
  const other = members.find((member) => member.userId !== user.id);
  const theirsLabel = other && members.length === 2 ? firstName(other.userName) : "Outras";
  const memberOptions = members.map((item) => ({
    userId: item.userId,
    userName: item.userName,
  }));

  const cards = result.value
    .map((debt) => toDebtCard(debt))
    .filter((debt) => {
      if (statusFilter === "open") {
        return debt.remainingCount > 0;
      }
      if (statusFilter === "done") {
        return debt.remainingCount === 0;
      }
      return true;
    })
    .map((debt) => ({
      ...debt,
      nextDueDate: debt.nextDueDate ? debt.nextDueDate.toISOString() : null,
    }));

  return (
    <Reveal className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3" data-reveal>
        <h2 className="font-display text-3xl">Dívidas</h2>
        {canEdit ? (
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

      <div data-reveal>
        <DebtsBoard
          canEdit={canEdit}
          currentUserId={user.id}
          debts={cards}
          isAdmin={admin}
          members={memberOptions}
          shared={shared}
          workspaceId={workspaceId}
        />
      </div>
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
      className={`nav-link relative z-10 shrink-0 ${
        active ? "font-semibold text-pine-dark" : ""
      }`}
      data-pill-active={active ? "true" : "false"}
      href={href}
    >
      {children}
    </Link>
  );
}
