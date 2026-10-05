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

const VIEW_KEY = "desparcele.installments.view";

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
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [blinkId, setBlinkId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(installments);
  }, [installments]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "calendar" || saved === "pipeline") {
        setView(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const node = document.getElementById(`installment-${highlightId}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, items, view]);

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

  function changeView(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
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
    if (!canEdit || view !== "list") {
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
      markNew(result.installmentId);
    }
    router.refresh();
  }

  const pipeline = useMemo(() => {
    const overdue: InstallmentListItem[] = [];
    const open: InstallmentListItem[] = [];
    const paid: InstallmentListItem[] = [];
    for (const item of items) {
      if (item.paid) {
        paid.push(item);
      } else if (isOverdue(item)) {
        overdue.push(item);
      } else {
        open.push(item);
      }
    }
    return { overdue, open, paid };
  }, [items]);

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
      </div>

      {error ? <FormError message={error} /> : null}

      {view === "list" ? (
        canEdit ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className="grid gap-3">
                {items.map((item) => (
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
            {items.map((item) => (
              <li
                className={`sheet ${blinkId === item.id ? "installment-blink" : ""}`}
                id={`installment-${item.id}`}
                key={item.id}
              >
                <InstallmentCardBody isNew={highlightId === item.id} item={item} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {view === "calendar" ? (
        <InstallmentsSvarCalendar highlightId={highlightId} items={items} />
      ) : null}

      {view === "pipeline" ? (
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
      ) : null}

      {canEdit ? (
        <div className="flex justify-center pt-1">
          <button
            aria-label="Adicionar parcela"
            className="inline-flex size-12 items-center justify-center rounded-full border border-pine/30 bg-pine-soft/40 text-pine-dark shadow-sm transition hover:bg-pine-soft disabled:opacity-40"
            disabled={adding || items.length >= 360}
            onClick={() => void addOne()}
            type="button"
          >
            <AppIcon className="size-6" name="tabler:plus" />
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
