"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addInstallmentAction, reorderInstallmentsAction } from "@/app/actions/debt";
import { InstallmentActions } from "@/components/forms/installment-actions";
import { FormError } from "@/components/forms/auth-forms";
import { FilterPills } from "@/components/motion/filter-pills";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { formatBRL } from "@/shared/utils/money";
import { formatDateFull } from "@/shared/utils/date";

const InstallmentsSvarCalendar = dynamic(
  () =>
    import("@/components/debt/installments-svar-calendar").then(
      (mod) => mod.InstallmentsSvarCalendar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(40rem,70vh)] w-full items-center justify-center rounded-3xl border border-line bg-white/60 text-sm text-ink/50">
        Carregando calendário…
      </div>
    ),
  },
);

export type InstallmentListItem = {
  id: string;
  number: number;
  amountCents: number;
  dueDate: string;
  paid: boolean;
  paidByName: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  reminderDisabled: boolean;
};

type ViewMode = "list" | "calendar" | "pipeline";
type StatusFilter = "all" | "open" | "paid" | "overdue";
type ListMode = "paged" | "infinite";

const VIEW_KEY = "desparcele.installments.view";
const LIST_MODE_KEY = "desparcele.installments.listMode";
const FILTER_KEY = "desparcele.installments.filter";
const PAGE_SIZE = 10;
const INFINITE_STEP = 10;

function parseItemDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`);
}

function isOverdue(item: InstallmentListItem, now = new Date()): boolean {
  if (item.paid) {
    return false;
  }
  const due = parseItemDate(item.dueDate);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return dueUtc < todayUtc;
}

function matchesFilter(item: InstallmentListItem, filter: StatusFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "paid") {
    return item.paid;
  }
  if (filter === "overdue") {
    return isOverdue(item);
  }
  return !item.paid;
}

export function InstallmentsList({
  workspaceId,
  debtId,
  installments,
  canEdit,
  remindersOnDebt,
}: {
  workspaceId: string;
  debtId: string;
  installments: InstallmentListItem[];
  canEdit: boolean;
  remindersOnDebt: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(installments);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listMode, setListMode] = useState<ListMode>("paged");
  const [listConfigOpen, setListConfigOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INFINITE_STEP);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [blinkId, setBlinkId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(installments);
  }, [installments]);

  useEffect(() => {
    try {
      const savedView = localStorage.getItem(VIEW_KEY);
      if (savedView === "list" || savedView === "calendar" || savedView === "pipeline") {
        setView(savedView);
      }
      const savedMode = localStorage.getItem(LIST_MODE_KEY);
      if (savedMode === "paged" || savedMode === "infinite") {
        setListMode(savedMode);
      }
      const savedFilter = localStorage.getItem(FILTER_KEY);
      if (
        savedFilter === "all" ||
        savedFilter === "open" ||
        savedFilter === "paid" ||
        savedFilter === "overdue"
      ) {
        setStatusFilter(savedFilter);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!listConfigOpen) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!configRef.current?.contains(event.target as Node)) {
        setListConfigOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [listConfigOpen]);

  useEffect(() => {
    setPage(1);
    setVisibleCount(INFINITE_STEP);
  }, [statusFilter, listMode]);

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const node = document.getElementById(`installment-${highlightId}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, items, view, page, visibleCount]);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }
      if (blinkTimer.current) {
        clearTimeout(blinkTimer.current);
      }
    };
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item, statusFilter)),
    [items, statusFilter],
  );

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const index = filtered.findIndex((item) => item.id === highlightId);
    if (index < 0) {
      return;
    }
    if (listMode === "paged") {
      setPage(Math.floor(index / PAGE_SIZE) + 1);
    } else {
      setVisibleCount((count) => Math.max(count, index + 1));
    }
  }, [highlightId, filtered, listMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleItems = useMemo(() => {
    if (view !== "list") {
      return filtered;
    }
    if (listMode === "infinite") {
      return filtered.slice(0, visibleCount);
    }
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, view, listMode, visibleCount, safePage]);

  const canDrag = canEdit && view === "list" && statusFilter === "all" && listMode === "infinite";

  const pipeline = useMemo(() => {
    const overdue: InstallmentListItem[] = [];
    const open: InstallmentListItem[] = [];
    const paid: InstallmentListItem[] = [];
    for (const item of filtered) {
      if (item.paid) {
        paid.push(item);
      } else if (isOverdue(item)) {
        overdue.push(item);
      } else {
        open.push(item);
      }
    }
    return { overdue, open, paid };
  }, [filtered]);

  function changeView(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  }

  function changeFilter(next: StatusFilter) {
    setStatusFilter(next);
    try {
      localStorage.setItem(FILTER_KEY, next);
    } catch {
      // ignore
    }
  }

  function changeListMode(next: ListMode) {
    setListMode(next);
    setListConfigOpen(false);
    try {
      localStorage.setItem(LIST_MODE_KEY, next);
    } catch {
      // ignore
    }
  }

  function markNew(id: string) {
    setHighlightId(id);
    setBlinkId(id);
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
    }
    if (blinkTimer.current) {
      clearTimeout(blinkTimer.current);
    }
    blinkTimer.current = setTimeout(() => setBlinkId(null), 1800);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 8000);
  }

  async function onDragEnd(event: DragEndEvent) {
    if (!canDrag) {
      return;
    }
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
    const next = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      number: index + 1,
    }));
    setItems(next);
    setError(null);

    const result = await reorderInstallmentsAction(
      workspaceId,
      debtId,
      next.map((item) => item.id),
    );
    if (result.error) {
      setItems(previous);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function addOne() {
    setAdding(true);
    setError(null);
    const result = await addInstallmentAction(workspaceId, debtId);
    setAdding(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.installmentId) {
      changeView("list");
      changeFilter("all");
      markNew(result.installmentId);
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterPills watch={view}>
          <ViewChip active={view === "list"} onClick={() => changeView("list")}>
            <AppIcon className="size-4" name="tabler:list" />
            Lista
          </ViewChip>
          <ViewChip active={view === "calendar"} onClick={() => changeView("calendar")}>
            <AppIcon className="size-4" name="tabler:calendar" />
            Calendário
          </ViewChip>
          <ViewChip active={view === "pipeline"} onClick={() => changeView("pipeline")}>
            <AppIcon className="size-4" name="tabler:layout-kanban" />
            Pipeline
          </ViewChip>
        </FilterPills>

        {view === "list" ? (
          <div className="relative" ref={configRef}>
            <button
              aria-label="Configurar lista"
              className="btn-ghost px-3 py-2"
              onClick={() => setListConfigOpen((open) => !open)}
              type="button"
            >
              <AppIcon className="size-4" name="tabler:settings" />
              Lista
            </button>
            {listConfigOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-64 space-y-2 rounded-2xl border border-line bg-card p-3 shadow-sheet">
                <p className="text-xs font-medium text-ink/60">Como mostrar a lista</p>
                <FancyCheckbox
                  checked={listMode === "paged"}
                  className="w-full"
                  label="Paginada"
                  tip="Padrão. Mostra de 10 em 10 com páginas."
                  onChange={(next) => {
                    if (next) {
                      changeListMode("paged");
                    }
                  }}
                />
                <FancyCheckbox
                  checked={listMode === "infinite"}
                  className="w-full"
                  label="Infinita"
                  tip="Carrega mais parcelas ao descer, sem páginas."
                  onChange={(next) => {
                    if (next) {
                      changeListMode("infinite");
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <FilterPills watch={statusFilter}>
        <ViewChip active={statusFilter === "all"} onClick={() => changeFilter("all")}>
          Todas
        </ViewChip>
        <ViewChip active={statusFilter === "open"} onClick={() => changeFilter("open")}>
          Abertas
        </ViewChip>
        <ViewChip active={statusFilter === "paid"} onClick={() => changeFilter("paid")}>
          Pagas
        </ViewChip>
        <ViewChip active={statusFilter === "overdue"} onClick={() => changeFilter("overdue")}>
          Atrasadas
        </ViewChip>
      </FilterPills>

      <p className="text-xs text-ink/50">
        {filtered.length} parcela{filtered.length === 1 ? "" : "s"}
        {statusFilter !== "all" ? " no filtro" : ""}
        {view === "list" && listMode === "paged"
          ? ` · página ${safePage} de ${totalPages}`
          : null}
      </p>

      {error ? <FormError message={error} /> : null}

      {view === "list" ? (
        filtered.length === 0 ? (
          <div className="sheet text-sm text-ink/55">Nenhuma parcela neste filtro.</div>
        ) : canDrag ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext
              items={visibleItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="grid gap-3">
                {visibleItems.map((item) => (
                  <SortableInstallmentCard
                    blink={blinkId === item.id}
                    canDelete={items.length > 1}
                    debtId={debtId}
                    isNew={highlightId === item.id}
                    item={item}
                    key={item.id}
                    remindersOnDebt={remindersOnDebt}
                    workspaceId={workspaceId}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <ul className="grid gap-3">
            {visibleItems.map((item) => (
              <li
                className={`sheet ${blinkId === item.id ? "installment-blink" : ""}`}
                id={`installment-${item.id}`}
                key={item.id}
              >
                <InstallmentCardBody isNew={highlightId === item.id} item={item} />
                {canEdit ? (
                  <InstallmentActions
                    canDelete={items.length > 1}
                    debtId={debtId}
                    installmentId={item.id}
                    paid={item.paid}
                    receiptUrl={item.receiptUrl}
                    reminderDisabled={item.reminderDisabled}
                    remindersOnDebt={remindersOnDebt}
                    workspaceId={workspaceId}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {view === "list" && listMode === "paged" && filtered.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="btn-ghost px-3 py-2"
            disabled={safePage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            <AppIcon className="size-4" name="tabler:chevron-left" />
            Anterior
          </button>
          <span className="text-sm text-ink/60">
            {safePage} / {totalPages}
          </span>
          <button
            className="btn-ghost px-3 py-2"
            disabled={safePage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            type="button"
          >
            Próxima
            <AppIcon className="size-4" name="tabler:chevron-right" />
          </button>
        </div>
      ) : null}

      {view === "list" && listMode === "infinite" && visibleCount < filtered.length ? (
        <div className="flex justify-center">
          <button
            className="btn-ghost"
            onClick={() => setVisibleCount((count) => count + INFINITE_STEP)}
            type="button"
          >
            Carregar mais
          </button>
        </div>
      ) : null}

      {view === "calendar" ? (
        <InstallmentsSvarCalendar highlightId={highlightId} items={filtered} />
      ) : null}

      {view === "pipeline" ? (
        filtered.length === 0 ? (
          <div className="sheet text-sm text-ink/55">Nenhuma parcela neste filtro.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            <PipelineColumn
              blinkId={blinkId}
              highlightId={highlightId}
              items={pipeline.overdue}
              title="Atrasadas"
              tone="clay"
            />
            <PipelineColumn
              blinkId={blinkId}
              highlightId={highlightId}
              items={pipeline.open}
              title="Em aberto"
              tone="ink"
            />
            <PipelineColumn
              blinkId={blinkId}
              highlightId={highlightId}
              items={pipeline.paid}
              title="Pagas"
              tone="moss"
            />
          </div>
        )
      ) : null}

      {canEdit ? (
        <div className="flex justify-center pt-1">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-pine/30 bg-pine-soft/40 px-5 py-3 text-sm font-medium text-pine-dark shadow-sm transition hover:bg-pine-soft disabled:opacity-40"
            disabled={adding || items.length >= 360}
            onClick={() => void addOne()}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:plus" />
            {adding ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ViewChip({
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

function SortableInstallmentCard({
  item,
  canDelete,
  workspaceId,
  debtId,
  remindersOnDebt,
  isNew,
  blink,
}: {
  item: InstallmentListItem;
  canDelete: boolean;
  workspaceId: string;
  debtId: string;
  remindersOnDebt: boolean;
  isNew: boolean;
  blink: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li
      className={`sheet ${blink ? "installment-blink" : ""}`}
      id={`installment-${item.id}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="mb-2">
        <button
          aria-label="Arrastar parcela"
          className="touch-none rounded-lg p-1 text-ink/35 hover:bg-line/50 hover:text-ink/70"
          type="button"
          {...attributes}
          {...listeners}
        >
          <AppIcon className="size-4" name="tabler:grip-vertical" />
        </button>
      </div>
      <InstallmentCardBody isNew={isNew} item={item} />
      <InstallmentActions
        canDelete={canDelete}
        debtId={debtId}
        installmentId={item.id}
        paid={item.paid}
        receiptUrl={item.receiptUrl}
        reminderDisabled={item.reminderDisabled}
        remindersOnDebt={remindersOnDebt}
        workspaceId={workspaceId}
      />
    </li>
  );
}

function InstallmentCardBody({
  item,
  isNew = false,
  compact = false,
}: {
  item: InstallmentListItem;
  isNew?: boolean;
  compact?: boolean;
}) {
  const due = parseItemDate(item.dueDate);
  const paidAt = item.paidAt ? parseItemDate(item.paidAt) : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <AppIcon
            name={item.paid ? "tabler:circle-check" : "tabler:clock"}
            className={item.paid ? "size-5 text-moss" : "size-5 text-clay"}
          />
          Parcela {item.number}
          <MonthBadge date={due} />
          {isNew ? (
            <span className="rounded-full bg-pine px-2 py-0.5 text-[11px] font-semibold text-white">
              Nova
            </span>
          ) : null}
        </p>
        {!compact ? (
          <>
            <p className="mt-1 text-sm text-ink/55">Vence {formatDateFull(due)}</p>
            {item.paid ? (
              <p className="mt-1 text-sm text-moss">
                Paga por {item.paidByName ?? "alguem"}
                {paidAt ? ` em ${formatDateFull(paidAt)}` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-xs text-ink/55">{formatDateFull(due)}</p>
        )}
      </div>
      <p className={`font-display ${compact ? "text-lg" : "text-2xl"}`}>
        {formatBRL(item.amountCents)}
      </p>
    </div>
  );
}

function PipelineColumn({
  title,
  items,
  tone,
  highlightId,
  blinkId,
}: {
  title: string;
  items: InstallmentListItem[];
  tone: "clay" | "ink" | "moss";
  highlightId: string | null;
  blinkId: string | null;
}) {
  const toneClass =
    tone === "clay" ? "text-clay" : tone === "moss" ? "text-moss" : "text-ink/70";

  return (
    <section className="rounded-3xl border border-line bg-white/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className={`text-sm font-semibold ${toneClass}`}>{title}</h4>
        <span className="text-xs text-ink/45">{items.length}</span>
      </div>
      <ul className="grid max-h-[28rem] gap-2 overflow-y-auto">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink/45">
            Nenhuma
          </li>
        ) : (
          items.map((item) => (
            <li
              className={`rounded-2xl border border-line bg-card px-3 py-3 ${
                blinkId === item.id ? "installment-blink" : ""
              }`}
              id={`installment-${item.id}`}
              key={item.id}
            >
              <InstallmentCardBody compact isNew={highlightId === item.id} item={item} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
