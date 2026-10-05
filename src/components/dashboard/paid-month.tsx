"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CountUpMoney } from "@/components/motion/count-up";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { MonthPicker } from "@/components/ui/month-picker";
import { firstName } from "@/modules/auth/domain/user";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";
import type { DebtKind } from "@/modules/debt/domain/debt";
import { formatDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

type OwnerFilter = "all" | "mine" | string;

export function PaidMonth({ data }: { data: DashboardView }) {
  const now = new Date();
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [includeLoan, setIncludeLoan] = useState(false);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [includeVariable, setIncludeVariable] = useState(true);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const other = data.members.find((member) => member.userId !== data.currentUserId);
  const theirsLabel = other && data.members.length === 2 ? other.firstName : "Outras";
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
  const isFutureMonth =
    year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  const paidItems = useMemo(() => {
    return data.paidHistory.filter((item) => {
      if (
        !matchesPayer(item.paidByUserId, item.ownerId, data.currentUserId, ownerFilter)
      ) {
        return false;
      }
      if (!matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring, includeVariable)) {
        return false;
      }

      // Conta do mês = vencimento no mês (não a data em que marcou/cadastrou como paga)
      const due = new Date(item.dueDate);
      return due.getUTCMonth() === month && due.getUTCFullYear() === year;
    });
  }, [data, ownerFilter, includeLoan, includeRecurring, includeVariable, month, year]);

  const monthPaidCents = paidItems.reduce((sum, item) => sum + item.amountCents, 0);
  const paidDebtIds = new Set(paidItems.map((item) => item.debtId));

  const payerRanking = useMemo(() => {
    const map = new Map<string, { userId: string; name: string; cents: number; count: number }>();

    for (const item of paidItems) {
      const userId = item.paidByUserId ?? item.ownerId;
      const name = item.paidByName ?? item.ownerName;
      const current = map.get(userId) ?? { userId, name, cents: 0, count: 0 };
      current.cents += item.amountCents;
      current.count += 1;
      map.set(userId, current);
    }

    return [...map.values()].sort((a, b) => b.cents - a.cents || b.count - a.count);
  }, [paidItems]);

  const heaviestDebts = useMemo(() => {
    const map = new Map<
      string,
      { debtId: string; debtName: string; cents: number; count: number }
    >();

    for (const item of paidItems) {
      const current = map.get(item.debtId) ?? {
        debtId: item.debtId,
        debtName: item.debtName,
        cents: 0,
        count: 0,
      };
      current.cents += item.amountCents;
      current.count += 1;
      map.set(item.debtId, current);
    }

    return [...map.values()].sort((a, b) => b.cents - a.cents).slice(0, 5);
  }, [paidItems]);

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
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">
          {isFutureMonth ? "Ainda não pago" : "Pago no mês"}
        </h2>
        <p className="mt-5 font-display text-4xl text-pine-dark sm:text-5xl">
          <CountUpMoney cents={monthPaidCents} />
        </p>
        <p className="mt-1 text-sm text-ink/50">
          {paidItems.length} parcela{paidItems.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          hint={`${paidDebtIds.size} conta${paidDebtIds.size === 1 ? "" : "s"}`}
          label="Contas baixadas"
          value={String(paidDebtIds.size)}
        />
        <StatCard
          hint={
            payerRanking[0] && payerRanking[0].cents > 0
              ? firstName(payerRanking[0].name)
              : isFutureMonth
                ? "Mês futuro"
                : "Sem pagamentos"
          }
          label="Quem mais pagou"
          value={
            payerRanking[0] && payerRanking[0].cents > 0 ? (
              <CountUpMoney cents={payerRanking[0].cents} />
            ) : (
              "—"
            )
          }
        />
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
              Eu paguei
            </FilterChip>
            <FilterChip
              active={ownerFilter === "theirs"}
              onClick={() => setOwnerFilter("theirs")}
            >
              {theirsLabel} pagou
            </FilterChip>
          </FilterPills>
        ) : null}
      </div>

      {heaviestDebts.length > 0 ? (
        <section className="sheet" data-reveal>
          <ol className="space-y-2">
            {heaviestDebts.map((item, index) => (
              <li key={item.debtId}>
                <Link
                  className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 transition-colors hover:bg-pine-soft/60"
                  href={`/w/${data.workspaceId}/debts/${item.debtId}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      index === 0
                        ? "bg-pine text-white"
                        : index === 1
                          ? "bg-pine-soft text-pine-dark"
                          : "bg-line/60 text-ink/60"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.debtName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <MetaBadge>
                        {item.count}x
                      </MetaBadge>
                    </div>
                  </div>
                  <p className="font-display text-xl">{formatBRL(item.cents)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {data.shared && payerRanking.length > 0 ? (
        <section className="sheet" data-reveal>
          <ul className="space-y-2">
            {payerRanking.map((person, index) => (
              <li
                className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3"
                key={person.userId}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    index === 0 ? "bg-pine text-white" : "bg-pine-soft text-pine-dark"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{firstName(person.name)}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <MetaBadge>
                      {person.count}x
                    </MetaBadge>
                  </div>
                </div>
                <p className="font-display text-xl">{formatBRL(person.cents)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="sheet" data-reveal>
        {paidItems.length === 0 ? (
          <p className="text-ink/60">
            {isFutureMonth ? "Mês futuro" : "Nenhuma parcela neste filtro"}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {paidItems.map((item) => (
              <li key={item.installmentId}>
                <Link
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-pine"
                  href={`/w/${data.workspaceId}/debts/${item.debtId}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.debtName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <MetaBadge>#{item.number}</MetaBadge>
                      {data.shared ? (
                        <MetaBadge>{firstName(item.paidByName ?? item.ownerName)}</MetaBadge>
                      ) : null}
                      {kindBadges(item.autoPay, item.kind).map((label) => (
                        <MetaBadge key={label}>{label}</MetaBadge>
                      ))}
                      <MetaBadge>{formatDate(new Date(item.dueDate))}</MetaBadge>
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-xl text-pine-dark">
                    {formatBRL(item.amountCents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
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

function matchesPayer(
  paidByUserId: string | null,
  ownerId: string,
  currentUserId: string,
  filter: OwnerFilter,
): boolean {
  return matchesOwner(paidByUserId ?? ownerId, currentUserId, filter);
}

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

function kindBadges(autoPay: boolean, kind: DebtKind): string[] {
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
  return parts;
}

function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-line/50 px-2 py-0.5 text-[11px] font-medium text-ink/60">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <article className="sheet" data-reveal>
      <p className="text-sm text-ink/55">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
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
