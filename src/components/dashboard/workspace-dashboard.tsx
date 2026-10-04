"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DebtBars } from "@/components/dashboard/debt-bars";
import { Scoreboard } from "@/components/dashboard/scoreboard";
import { CreateDebtModal } from "@/components/forms/create-debt-modal";
import { CountUpMoney } from "@/components/motion/count-up";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";
import { formatDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

type OwnerFilter = "all" | "mine" | string;
type TimeFilter = "month" | "overdue" | "all";

export function WorkspaceDashboard({ data }: { data: DashboardView }) {
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  const other = data.members.find((member) => member.userId !== data.currentUserId);
  const theirsLabel = other && data.members.length === 2 ? other.firstName : "Outras";

  const visibleSlices = useMemo(() => {
    return data.slices.filter((item) => matchesOwner(item.ownerId, data.currentUserId, ownerFilter));
  }, [data, ownerFilter]);

  const visibleUpcoming = useMemo(() => {
    return data.upcoming.filter((item) => {
      if (!matchesOwner(item.ownerId, data.currentUserId, ownerFilter)) {
        return false;
      }

      if (timeFilter === "overdue") {
        return item.overdue;
      }

      if (timeFilter === "month") {
        const due = new Date(item.dueDate);
        const now = new Date();
        return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [data, ownerFilter, timeFilter]);

  const filteredDue = visibleSlices.reduce((sum, item) => sum + item.remainingCents, 0);
  const suggestionVisible =
    data.suggestion &&
    visibleSlices.some((item) => item.id === data.suggestion?.debtId);

  return (
    <Reveal className="space-y-5">
      <Scoreboard data={data} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="tabler:wallet"
          label="Total devido"
          value={<CountUpMoney cents={ownerFilter === "all" ? data.totalDueCents : filteredDue} />}
          hint={`${data.openDebtCount} em aberto`}
        />
        <StatCard
          icon="tabler:calendar-month"
          label="Este mês"
          value={<CountUpMoney cents={data.monthDueCents} />}
          hint={`${data.monthCount} parcelas`}
        />
        <StatCard
          icon="tabler:alert-circle"
          label="Atrasado"
          value={<CountUpMoney cents={data.overdueCents} />}
          hint={`${data.overdueCount} parcelas`}
          warn={data.overdueCount > 0}
        />
        <article
          className="sheet border-pine/20 bg-pine-soft/70 sm:col-span-2 lg:col-span-1"
          data-reveal
        >
          <p className="flex items-center gap-2 text-sm text-pine-dark">
            <AppIcon name="tabler:target-arrow" className="size-4" />
            Pague primeiro
          </p>
          {suggestionVisible && data.suggestion ? (
            <>
              <p className="mt-3 font-display text-2xl leading-tight">{data.suggestion.debtName}</p>
              <p className="mt-1 text-sm text-ink/65">
                {data.suggestion.reason} · {data.suggestion.remainingCount} restantes
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pine-dark"
                href={`/w/${data.workspaceId}/debts/${data.suggestion.debtId}`}
              >
                Ver dívida
                <AppIcon name="tabler:chevron-right" className="size-4" />
              </Link>
            </>
          ) : (
            <p className="mt-3 font-display text-2xl">Nada pendente</p>
          )}
        </article>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" data-reveal>
        {data.shared ? (
          <FilterGroup watch={ownerFilter}>
            <FilterChip active={ownerFilter === "all"} onClick={() => setOwnerFilter("all")}>
              Todas
            </FilterChip>
            <FilterChip active={ownerFilter === "mine"} onClick={() => setOwnerFilter("mine")}>
              Minhas
            </FilterChip>
            <FilterChip
              active={ownerFilter === "theirs"}
              onClick={() => setOwnerFilter("theirs")}
            >
              {theirsLabel}
            </FilterChip>
          </FilterGroup>
        ) : null}
        <FilterGroup watch={timeFilter}>
          <FilterChip active={timeFilter === "month"} onClick={() => setTimeFilter("month")}>
            Mês
          </FilterChip>
          <FilterChip active={timeFilter === "overdue"} onClick={() => setTimeFilter("overdue")}>
            Atrasadas
          </FilterChip>
          <FilterChip active={timeFilter === "all"} onClick={() => setTimeFilter("all")}>
            Agenda
          </FilterChip>
        </FilterGroup>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="sheet" data-reveal>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Próximas</h2>
            {data.canEdit ? (
              <CreateDebtModal
                currentUserId={data.currentUserId}
                defaultDueDate={data.defaultDueDate}
                members={data.members.map((member) => ({
                  userId: member.userId,
                  userName: member.name,
                }))}
                shared={data.shared}
                triggerClassName="btn-ghost"
                triggerLabel="Nova"
                workspaceId={data.workspaceId}
              />
            ) : null}
          </div>
          {visibleUpcoming.length === 0 ? (
            <p className="flex items-center gap-2 text-ink/60">
              <AppIcon name="tabler:calendar-off" className="size-5" />
              Nenhuma parcela neste filtro
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visibleUpcoming.map((item) => (
                <li key={item.installmentId}>
                  <Link
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-pine"
                    href={`/w/${data.workspaceId}/debts/${item.debtId}`}
                  >
                    <div>
                      <p className="font-medium">{item.debtName}</p>
                      <p className="text-sm text-ink/55">
                        Parcela {item.number}
                        {data.shared ? ` · ${item.ownerName}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl">{formatBRL(item.amountCents)}</p>
                      <p className={`text-sm ${item.overdue ? "text-clay" : "text-ink/55"}`}>
                        {item.overdue ? "Atrasada · " : ""}
                        {formatDate(new Date(item.dueDate))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DebtBars slices={visibleSlices} />
      </div>
    </Reveal>
  );
}

function matchesOwner(ownerId: string, currentUserId: string, filter: OwnerFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "mine") {
    return ownerId === currentUserId;
  }

  return ownerId !== currentUserId;
}

function StatCard({
  icon,
  label,
  value,
  hint,
  warn = false,
}: {
  icon: string;
  label: string;
  value: ReactNode;
  hint: string;
  warn?: boolean;
}) {
  return (
    <article className="sheet" data-reveal>
      <p className="flex items-center gap-2 text-sm text-ink/55">
        <AppIcon name={icon} className="size-4" />
        {label}
      </p>
      <p className={`mt-3 font-display text-3xl ${warn ? "text-clay" : ""}`}>{value}</p>
      <p className="mt-1 text-sm text-ink/50">{hint}</p>
    </article>
  );
}

function FilterGroup({ children, watch }: { children: ReactNode; watch: string }) {
  return <FilterPills watch={watch}>{children}</FilterPills>;
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`nav-link relative z-10 shrink-0 snap-start ${active ? "text-ink" : ""}`}
      data-pill-active={active ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
