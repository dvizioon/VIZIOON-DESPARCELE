"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CountUpMoney } from "@/components/motion/count-up";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
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
  const [includeVariable, setIncludeVariable] = useState(false);
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

      const paidOn = new Date(item.paidAt ?? item.dueDate);
      return paidOn.getMonth() === month && paidOn.getFullYear() === year;
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
          {paidItems.length} parcela{paidItems.length === 1 ? "" : "s"} pagas · {paidDebtIds.size}{" "}
          dívida{paidDebtIds.size === 1 ? "" : "s"}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          hint={`${paidDebtIds.size} conta${paidDebtIds.size === 1 ? "" : "s"} neste mês`}
          icon="tabler:circle-check"
          label="Contas baixadas"
          value={String(paidDebtIds.size)}
        />
        <StatCard
          hint={
            payerRanking[0] && payerRanking[0].cents > 0
              ? `${firstName(payerRanking[0].name)} na frente`
              : isFutureMonth
                ? "Mês ainda não chegou"
                : "Ninguém pagou neste filtro"
          }
          icon="tabler:trophy"
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
          <h3 className="font-display text-2xl">Contas mais puxadas</h3>
          <p className="mt-1 text-sm text-ink/55">Ranking do que mais saiu do bolso neste mês.</p>
          <ol className="mt-4 space-y-2">
            {heaviestDebts.map((item, index) => (
              <li key={item.debtId}>
                <Link
                  className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 transition-colors hover:bg-pine-soft/60"
                  href={`/w/${data.workspaceId}/debts/${item.debtId}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-lg ${
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
                    <p className="text-sm text-ink/55">
                      {item.count} parcela{item.count === 1 ? "" : "s"}
                    </p>
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
          <h3 className="font-display text-2xl">Quem pagou mais</h3>
          <p className="mt-1 text-sm text-ink/55">Total baixado por pessoa neste mês.</p>
          <ul className="mt-4 space-y-2">
            {payerRanking.map((person, index) => (
              <li
                className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3"
                key={person.userId}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-lg ${
                    index === 0 ? "bg-pine text-white" : "bg-pine-soft text-pine-dark"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{firstName(person.name)}</p>
                  <p className="text-sm text-ink/55">
                    {person.count} parcela{person.count === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="font-display text-xl">{formatBRL(person.cents)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="sheet" data-reveal>
        <h3 className="font-display text-2xl">Parcelas pagas</h3>
        {paidItems.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-ink/60">
            <AppIcon name="tabler:calendar-off" className="size-5" />
            {isFutureMonth
              ? "Mês futuro — ainda não há pagamentos"
              : "Nenhuma parcela paga neste filtro"}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {paidItems.map((item) => (
              <li key={item.installmentId}>
                <Link
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-pine"
                  href={`/w/${data.workspaceId}/debts/${item.debtId}`}
                >
                  <div>
                    <p className="font-medium">{item.debtName}</p>
                    <p className="text-sm text-ink/55">
                      Parcela {item.number}
                      {data.shared ? ` · ${firstName(item.paidByName ?? item.ownerName)}` : ""}
                      {itemTag(item.autoPay, item.kind)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-pine-dark">
                      {formatBRL(item.amountCents)}
                    </p>
                    <p className="text-sm text-ink/55">
                      {formatDate(new Date(item.paidAt ?? item.dueDate))}
                    </p>
                  </div>
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
}: {
  icon: string;
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <article className="sheet" data-reveal>
      <p className="flex items-center gap-2 text-sm text-ink/55">
        <AppIcon name={icon} className="size-4" />
        {label}
      </p>
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
