"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CountUpMoney } from "@/components/motion/count-up";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
import { MonthPicker } from "@/components/ui/month-picker";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";
import type { DebtKind } from "@/modules/debt/domain/debt";
import { formatDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

type OwnerFilter = "all" | "mine" | string;

export function MonthTotals({ data }: { data: DashboardView }) {
  const now = new Date();
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [includeLoan, setIncludeLoan] = useState(false);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [includeVariable, setIncludeVariable] = useState(false);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const other = data.members.find((member) => member.userId !== data.currentUserId);
  const theirsLabel = other && data.members.length === 2 ? other.firstName : "Outras";
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const monthItems = useMemo(() => {
    return data.upcoming.filter((item) => {
      if (!matchesOwner(item.ownerId, data.currentUserId, ownerFilter)) {
        return false;
      }
      if (!matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring, includeVariable)) {
        return false;
      }

      const due = new Date(item.dueDate);
      return due.getMonth() === month && due.getFullYear() === year;
    });
  }, [data, ownerFilter, includeLoan, includeRecurring, includeVariable, month, year]);

  const overdueItems = useMemo(() => {
    return data.upcoming.filter(
      (item) =>
        item.overdue &&
        matchesOwner(item.ownerId, data.currentUserId, ownerFilter) &&
        matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring, includeVariable),
    );
  }, [data, ownerFilter, includeLoan, includeRecurring, includeVariable]);

  const monthDueCents = monthItems.reduce((sum, item) => sum + item.amountCents, 0);
  const overdueCents = overdueItems.reduce((sum, item) => sum + item.amountCents, 0);
  const openDebtIds = new Set(monthItems.map((item) => item.debtId));
  const suggestionVisible =
    isCurrentMonth &&
    data.suggestion &&
    data.slices.some(
      (item) =>
        item.id === data.suggestion?.debtId &&
        matchesOwner(item.ownerId, data.currentUserId, ownerFilter) &&
        matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring, includeVariable),
    );

  return (
    <Reveal className="space-y-5">
      <div className="sheet" data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthPicker
            month={month}
            onChange={({ month: nextMonth, year: nextYear }) => {
              setMonth(nextMonth);
              setYear(nextYear);
            }}
            year={year}
          />
          {!isCurrentMonth ? (
            <button
              className="text-sm font-medium text-pine-dark hover:underline"
              onClick={() => {
                setMonth(now.getMonth());
                setYear(now.getFullYear());
              }}
              type="button"
            >
              Voltar ao mês atual
            </button>
          ) : null}
        </div>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Devido no mês</h2>
        <p className="mt-5 font-display text-4xl text-pine-dark sm:text-5xl">
          <CountUpMoney cents={monthDueCents} />
        </p>
        <p className="mt-1 text-sm text-ink/50">
          {monthItems.length} parcela{monthItems.length === 1 ? "" : "s"} em aberto ·{" "}
          {openDebtIds.size} dívida{openDebtIds.size === 1 ? "" : "s"}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          hint={`${openDebtIds.size} com parcela neste mês`}
          icon="tabler:list-check"
          label="Dívidas no mês"
          value={String(openDebtIds.size)}
        />
        <StatCard
          hint={`${overdueItems.length} parcela${overdueItems.length === 1 ? "" : "s"}`}
          icon="tabler:alert-circle"
          label="Atrasado"
          value={<CountUpMoney cents={overdueCents} />}
          warn={overdueItems.length > 0}
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
                {data.suggestion.reason} · próxima {formatBRL(data.suggestion.nextAmountCents)}
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
            <p className="mt-3 font-display text-2xl">
              {isCurrentMonth ? "Nada pendente" : "Sugestão só no mês atual"}
            </p>
          )}
        </article>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" data-reveal>
        <div className="flex flex-wrap gap-2">
          <FancyCheckbox checked={includeLoan} label="Empréstimo" onChange={setIncludeLoan} />
          <FancyCheckbox
            checked={includeRecurring}
            label="Recorrência"
            onChange={setIncludeRecurring}
          />
          <FancyCheckbox checked={includeVariable} label="Variável" onChange={setIncludeVariable} />
        </div>
        {data.shared ? (
          <FilterPills watch={ownerFilter}>
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
          </FilterPills>
        ) : null}
      </div>

      <section className="sheet" data-reveal>
        <h3 className="font-display text-2xl">Parcelas do mês</h3>
        {monthItems.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-ink/60">
            <AppIcon name="tabler:calendar-off" className="size-5" />
            Nenhuma parcela em aberto neste filtro
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {monthItems.map((item) => (
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
                      {itemTag(item.autoPay, item.kind)}
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

      {overdueItems.length > 0 ? (
        <section className="sheet" data-reveal>
          <h3 className="font-display text-2xl">Atrasadas</h3>
          <p className="mt-1 text-sm text-ink/55">
            Ainda em aberto e já passaram do vencimento (podem ser de meses anteriores).
          </p>
          <ul className="mt-2 divide-y divide-line">
            {overdueItems.map((item) => (
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
                      {itemTag(item.autoPay, item.kind)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-clay">{formatBRL(item.amountCents)}</p>
                    <p className="text-sm text-clay">{formatDate(new Date(item.dueDate))}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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

/** Padrão: só parcelada comum. Marca para somar empréstimo / recorrente / variável. */
function matchesInclude(
  autoPay: boolean,
  kind: DebtKind,
  includeLoan: boolean,
  includeRecurring: boolean,
  includeVariable: boolean,
): boolean {
  const isLoan = autoPay;
  const isRecurring = kind === "RECURRING";
  const isVariable = kind === "VARIABLE";

  if (!isLoan && !isRecurring && !isVariable) {
    return true;
  }

  if (isLoan && includeLoan) {
    return true;
  }

  if (isRecurring && includeRecurring) {
    return true;
  }

  if (isVariable && includeVariable) {
    return true;
  }

  return false;
}

function itemTag(autoPay: boolean, kind: DebtKind): string {
  const parts: string[] = [];
  if (autoPay) {
    parts.push("baixa auto");
  }
  if (kind === "RECURRING") {
    parts.push("recorrente");
  }
  if (kind === "VARIABLE") {
    parts.push("variável");
  }
  return parts.length ? ` · ${parts.join(" · ")}` : "";
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
      className={`nav-link relative z-10 shrink-0 snap-start ${
        active ? "font-semibold text-pine-dark" : ""
      }`}
      data-pill-active={active ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
