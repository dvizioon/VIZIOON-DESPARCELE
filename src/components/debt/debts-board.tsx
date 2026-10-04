"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderDebtsAction } from "@/app/actions/debt";
import { DebtSettingsModal } from "@/components/debt/debt-settings-modal";
import { FilterPills } from "@/components/motion/filter-pills";
import { AppIcon } from "@/components/ui/icon";
import type { DebtCardView } from "@/modules/debt/application/get-dashboard";
import type { DebtHideMode, DebtKind } from "@/modules/debt/domain/debt";
import { formatDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

/** Novos layouts entram aqui sem quebrar a página. */
export type DebtLayoutMode = "list" | "cards";

type MonthFilter = "all" | "due_month" | "paid_month";

type MemberOption = {
  userId: string;
  userName: string;
};

type DebtsBoardProps = {
  workspaceId: string;
  debts: DebtCardView[];
  shared: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberOption[];
};

const LAYOUT_KEY = "desparcele.debts.layout";

export function DebtsBoard({
  workspaceId,
  debts: initialDebts,
  shared,
  canEdit,
  isAdmin,
  currentUserId,
  members,
}: DebtsBoardProps) {
  const [items, setItems] = useState(initialDebts);
  const [layout, setLayout] = useState<DebtLayoutMode>("list");
  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialDebts);
  }, [initialDebts]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === "list" || saved === "cards") {
        setLayout(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  function changeLayout(next: DebtLayoutMode) {
    setLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      // ignore
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((debt) => {
      if (q && !debt.name.toLowerCase().includes(q)) {
        return false;
      }
      if (monthFilter === "due_month" && debt.dueThisMonthCount === 0) {
        return false;
      }
      if (monthFilter === "paid_month" && debt.paidThisMonthCount === 0) {
        return false;
      }
      return true;
    });
  }, [items, query, monthFilter]);

  const filtersActive = query.trim().length > 0 || monthFilter !== "all";
  const canDrag = canEdit && !filtersActive;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    setError(null);

    const result = await reorderDebtsAction(
      workspaceId,
      next.map((item) => item.id),
    );
    if (result.error) {
      setItems(previous);
      setError(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="relative min-w-[12rem] flex-1 sm:max-w-sm">
          <AppIcon
            name="tabler:search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40"
          />
          <input
            className="field w-full pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome"
            value={query}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <FilterPills watch={monthFilter}>
            <FilterChip active={monthFilter === "all"} onClick={() => setMonthFilter("all")}>
              No mês: todas
            </FilterChip>
            <FilterChip
              active={monthFilter === "due_month"}
              onClick={() => setMonthFilter("due_month")}
            >
              Vence no mês
            </FilterChip>
            <FilterChip
              active={monthFilter === "paid_month"}
              onClick={() => setMonthFilter("paid_month")}
            >
              Pagas no mês
            </FilterChip>
          </FilterPills>

          <FilterPills watch={layout}>
            <FilterChip active={layout === "list"} onClick={() => changeLayout("list")}>
              <AppIcon name="tabler:list" className="size-4" />
              Lista
            </FilterChip>
            <FilterChip active={layout === "cards"} onClick={() => changeLayout("cards")}>
              <AppIcon name="tabler:layout-grid" className="size-4" />
              Cards
            </FilterChip>
          </FilterPills>
        </div>
      </div>

      {canDrag ? (
        <p className="text-xs text-ink/45">Arraste pelo ícone para reordenar.</p>
      ) : filtersActive && canEdit ? (
        <p className="text-xs text-ink/45">Limpe busca/filtro do mês para reordenar.</p>
      ) : null}

      {error ? <p className="text-sm text-clay">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="sheet flex items-center gap-3 text-ink/60">
          <AppIcon name="tabler:notes-off" className="size-5" />
          Nenhuma dívida neste filtro
        </div>
      ) : canDrag ? (
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={filtered.map((item) => item.id)}
            strategy={layout === "cards" ? rectSortingStrategy : verticalListSortingStrategy}
          >
            <DebtLayout
              canEdit={canEdit}
              currentUserId={currentUserId}
              debts={filtered}
              isAdmin={isAdmin}
              layout={layout}
              members={members}
              shared={shared}
              sortable
              workspaceId={workspaceId}
            />
          </SortableContext>
        </DndContext>
      ) : (
        <DebtLayout
          canEdit={canEdit}
          currentUserId={currentUserId}
          debts={filtered}
          isAdmin={isAdmin}
          layout={layout}
          members={members}
          shared={shared}
          sortable={false}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}

function DebtLayout({
  layout,
  debts,
  sortable,
  ...rest
}: {
  layout: DebtLayoutMode;
  debts: DebtCardView[];
  sortable: boolean;
  workspaceId: string;
  shared: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberOption[];
}) {
  if (layout === "cards") {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {debts.map((debt) =>
          sortable ? (
            <SortableDebt key={debt.id} debt={debt} variant="card" {...rest} />
          ) : (
            <li key={debt.id}>
              <DebtItem debt={debt} dragHandle={null} variant="card" {...rest} />
            </li>
          ),
        )}
      </ul>
    );
  }

  return (
    <ul className="grid gap-3">
      {debts.map((debt) =>
        sortable ? (
          <SortableDebt key={debt.id} debt={debt} variant="list" {...rest} />
        ) : (
          <li key={debt.id}>
            <DebtItem debt={debt} dragHandle={null} variant="list" {...rest} />
          </li>
        ),
      )}
    </ul>
  );
}

function SortableDebt({
  debt,
  variant,
  ...rest
}: {
  debt: DebtCardView;
  variant: "list" | "card";
  workspaceId: string;
  shared: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberOption[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: debt.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <DebtItem
        debt={debt}
        dragHandle={
          <button
            className="rounded-full p-2 text-ink/40 hover:bg-white hover:text-ink"
            type="button"
            {...attributes}
            {...listeners}
          >
            <AppIcon name="tabler:grip-vertical" className="size-5" />
            <span className="sr-only">Arrastar</span>
          </button>
        }
        variant={variant}
        {...rest}
      />
    </li>
  );
}

function DebtItem({
  debt,
  workspaceId,
  shared,
  canEdit,
  isAdmin,
  currentUserId,
  members,
  variant,
  dragHandle,
}: {
  debt: DebtCardView;
  workspaceId: string;
  shared: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberOption[];
  variant: "list" | "card";
  dragHandle: ReactNode;
}) {
  const paidCount = debt.installmentCount - debt.remainingCount;
  const progress = Math.round((paidCount / debt.installmentCount) * 100);
  const overdue = debt.nextDueDate
    ? new Date(debt.nextDueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    : false;

  const settings = canEdit ? (
    <DebtSettingsModal
      autoPay={debt.autoPay}
      canManageVisibility={isAdmin}
      currentUserId={currentUserId}
      debtId={debt.id}
      debtName={debt.name}
      hideMode={debt.hideMode as DebtHideMode}
      hiddenUserIds={debt.hiddenUserIds}
      kind={debt.kind as DebtKind}
      members={members}
      recurringPaused={debt.recurringPaused}
      remindersEnabled={debt.remindersEnabled}
      shared={shared}
      workspaceId={workspaceId}
    />
  ) : null;

  if (variant === "card") {
    return (
      <div className="sheet relative h-full overflow-hidden">
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
          {dragHandle}
          {settings}
        </div>
        <Link className="block pr-16" href={`/w/${workspaceId}/debts/${debt.id}`}>
          <p className="font-display text-2xl leading-tight">{debt.name}</p>
          <p className="mt-1 text-sm text-ink/55">
            {shared ? `${debt.ownerName} · ` : ""}
            {debt.remainingCents === 0 ? "Quitada" : formatBRL(debt.remainingCents) + " resta"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <DebtBadges debt={debt} isAdmin={isAdmin} overdue={overdue} paidCount={paidCount} />
          </div>
          <div className="mt-4">
            <div className="usage-track relative h-2.5 overflow-hidden rounded-full">
              <div
                className="progress-fill h-full rounded-full bg-gradient-to-r from-pine via-[#148576] to-moss"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink/45">{progress}% · {formatBRL(debt.totalAmountCents)}</p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="sheet relative">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5">
        {dragHandle}
        {settings}
      </div>
      <Link className="block pr-16" href={`/w/${workspaceId}/debts/${debt.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-2xl">{debt.name}</p>
            <p className="mt-1 text-sm text-ink/55">
              {shared ? `${debt.ownerName} · ` : ""}
              cadastro de {debt.createdByName}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <DebtBadges debt={debt} isAdmin={isAdmin} overdue={overdue} paidCount={paidCount} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <AmountTag
              hint={`${debt.installmentCount}x`}
              label="Total"
              muted
              value={formatBRL(debt.totalAmountCents)}
            />
            <AmountTag
              highlight
              hint={debt.remainingCents === 0 ? "Tudo pago" : `${debt.remainingCount} em aberto`}
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
    </div>
  );
}

function DebtBadges({
  debt,
  isAdmin,
  overdue,
  paidCount,
}: {
  debt: DebtCardView;
  isAdmin: boolean;
  overdue: boolean;
  paidCount: number;
}) {
  return (
    <>
      {debt.kind === "RECURRING" ? (
        <DebtBadge icon="tabler:repeat" tone="pine">
          {debt.recurringPaused ? "Recorrente pausada" : "Recorrente"}
        </DebtBadge>
      ) : null}
      {debt.autoPay ? (
        <DebtBadge icon="tabler:building-bank" tone="pine">
          Empréstimo
        </DebtBadge>
      ) : null}
      {isAdmin && debt.hideMode !== "NONE" ? (
        <DebtBadge icon="tabler:eye-off" tone="plain">
          {debt.hideMode === "ALL" ? "Oculta" : "Oculta parcial"}
        </DebtBadge>
      ) : null}
      {debt.nextDueDate ? (
        <>
          <DebtBadge icon="tabler:cash" tone="pine">
            Vai pagar {formatBRL(debt.nextAmountCents)}
          </DebtBadge>
          <DebtBadge icon="tabler:calendar-due" tone={overdue ? "clay" : "plain"}>
            {overdue ? "Atrasada " : ""}
            {formatDate(new Date(debt.nextDueDate))}
          </DebtBadge>
        </>
      ) : (
        <DebtBadge icon="tabler:circle-check" tone="pine">
          Tudo pago
        </DebtBadge>
      )}
      {debt.dueThisMonthCount > 0 ? (
        <DebtBadge icon="tabler:calendar-month" tone="plain">
          {debt.dueThisMonthCount} no mês
        </DebtBadge>
      ) : null}
      {debt.paidThisMonthCount > 0 ? (
        <DebtBadge icon="tabler:checks" tone="pine">
          {debt.paidThisMonthCount} paga{debt.paidThisMonthCount === 1 ? "" : "s"} no mês
        </DebtBadge>
      ) : null}
      <DebtBadge icon="tabler:layers-subtract" tone="plain">
        {paidCount}/{debt.installmentCount} paga{paidCount === 1 ? "" : "s"}
      </DebtBadge>
    </>
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
  children: ReactNode;
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
