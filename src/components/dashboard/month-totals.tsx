"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CountUpMoney } from "@/components/motion/count-up";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";
import type { DebtKind } from "@/modules/debt/domain/debt";
import { formatDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

type OwnerFilter = "all" | "mine" | string;

export function MonthTotals({ data }: { data: DashboardView }) {
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [includeLoan, setIncludeLoan] = useState(false);
  const [includeRecurring, setIncludeRecurring] = useState(false);

  const other = data.members.find((member) => member.userId !== data.currentUserId);
  const theirsLabel = other && data.members.length === 2 ? other.firstName : "Outras";
  const monthLabel = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const monthItems = useMemo(() => {
    const now = new Date();
    return data.upcoming.filter((item) => {
      if (!matchesOwner(item.ownerId, data.currentUserId, ownerFilter)) {
        return false;
      }
      if (!matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring)) {
        return false;
      }

      const due = new Date(item.dueDate);
      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
    });
  }, [data, ownerFilter, includeLoan, includeRecurring]);

  const overdueItems = useMemo(() => {
    return data.upcoming.filter(
      (item) =>
        item.overdue &&
        matchesOwner(item.ownerId, data.currentUserId, ownerFilter) &&
        matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring),
    );
  }, [data, ownerFilter, includeLoan, includeRecurring]);

  const monthDueCents = monthItems.reduce((sum, item) => sum + item.amountCents, 0);
  const overdueCents = overdueItems.reduce((sum, item) => sum + item.amountCents, 0);
  const openDebtIds = new Set(monthItems.map((item) => item.debtId));
  const suggestionVisible =
    data.suggestion &&
    data.slices.some(
      (item) =>
        item.id === data.suggestion?.debtId &&
        matchesOwner(item.ownerId, data.currentUserId, ownerFilter) &&
        matchesInclude(item.autoPay, item.kind, includeLoan, includeRecurring),
    );

  return (
    <Reveal className="space-y-5">
      <div className="sheet" data-reveal>
        <p className="text-sm capitalize text-ink/55">{monthLabel}</p>
        <h2 className="mt-1 font-display text-3xl sm:text-4xl">Devido no mês</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Parcelas em aberto deste mês. Por padrão fica fora o que já desconta na conta
          (empréstimo) e o que é recorrente — marque abaixo se quiser somar.
        </p>
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
            <p className="mt-3 font-display text-2xl">Nada pendente</p>
          )}
        </article>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" data-reveal>
        <div className="flex flex-wrap gap-2">
          <IncludeCheck
            checked={includeLoan}
            label="Empréstimo"
            onChange={setIncludeLoan}
          />
          <IncludeCheck
            checked={includeRecurring}
            label="Recorrência"
            onChange={setIncludeRecurring}
          />
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

/** Padrão: só parcelada comum. Marca para somar empréstimo e/ou recorrente. */
function matchesInclude(
  autoPay: boolean,
  kind: DebtKind,
  includeLoan: boolean,
  includeRecurring: boolean,
): boolean {
  const isLoan = autoPay;
  const isRecurring = kind === "RECURRING";

  if (!isLoan && !isRecurring) {
    return true;
  }

  if (isLoan && includeLoan) {
    return true;
  }

  if (isRecurring && includeRecurring) {
    return true;
  }

  return false;
}

function itemTag(autoPay: boolean, kind: DebtKind): string {
  const parts: string[] = [];
  if (autoPay) {
    parts.push("empréstimo");
  }
  if (kind === "RECURRING") {
    parts.push("recorrente");
  }
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

function IncludeCheck({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-2 text-sm text-ink/80">
      <input
        checked={checked}
        className="size-4 accent-[var(--pine)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
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
      className={`nav-link relative z-10 shrink-0 snap-start ${active ? "text-ink" : ""}`}
      data-pill-active={active ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
