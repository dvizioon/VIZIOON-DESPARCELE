"use client";

import { useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { AppIcon } from "@/components/ui/icon";
import { Tip } from "@/components/ui/tip";
import { addMonths, parseDateInput, toCalendarInputValue } from "@/shared/utils/date";

export type PreviewChargeRow = {
  id: string;
  number: number;
  amountInput: string;
  dueDate: string;
  paid: boolean;
};

export function newPreviewRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function renumber(rows: PreviewChargeRow[]): PreviewChargeRow[] {
  return rows.map((row, index) => ({ ...row, number: index + 1 }));
}

/** Mantém as datas em sequência a partir da primeira, após mover. */
function cascadeDates(rows: PreviewChargeRow[]): PreviewChargeRow[] {
  if (rows.length === 0) {
    return rows;
  }
  try {
    const base = parseDateInput(rows[0]!.dueDate);
    return renumber(
      rows.map((row, index) => ({
        ...row,
        dueDate: toCalendarInputValue(addMonths(base, index)),
      })),
    );
  } catch {
    return renumber(rows);
  }
}

export function PreviewChargesList({
  rows,
  disabled,
  cascadeOnDateEdit = true,
  addBeforeAsPaid = false,
  onChange,
}: {
  rows: PreviewChargeRow[];
  disabled?: boolean;
  /** Em parcelas, editar uma data empurra as seguintes. Em mensal, não. */
  cascadeOnDateEdit?: boolean;
  /** Cobranças inseridas no topo já entram como pagas (mensal/variável). */
  addBeforeAsPaid?: boolean;
  onChange: (rows: PreviewChargeRow[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [pendingRemove, setPendingRemove] = useState<"last" | string | null>(null);

  function updateAmount(index: number, value: string) {
    onChange(rows.map((row, i) => (i >= index ? { ...row, amountInput: value } : row)));
  }

  function updateDueDate(index: number, value: string) {
    const next = rows.map((row, i) => (i === index ? { ...row, dueDate: value } : row));
    if (!cascadeOnDateEdit) {
      onChange(next);
      return;
    }
    try {
      const base = parseDateInput(value);
      for (let i = index + 1; i < next.length; i += 1) {
        next[i] = {
          ...next[i]!,
          dueDate: toCalendarInputValue(addMonths(base, i - index)),
        };
      }
    } catch {
      // só a linha editada
    }
    onChange(next);
  }

  function togglePaid(index: number) {
    onChange(rows.map((row, i) => (i === index ? { ...row, paid: !row.paid } : row)));
  }

  function addBefore() {
    if (rows.length >= 120 || rows.length === 0) {
      return;
    }
    try {
      const first = rows[0]!;
      const base = parseDateInput(first.dueDate);
      const row: PreviewChargeRow = {
        id: newPreviewRowId(),
        number: 1,
        amountInput: first.amountInput,
        dueDate: toCalendarInputValue(addMonths(base, -1)),
        paid: addBeforeAsPaid,
      };
      onChange(renumber([row, ...rows]));
    } catch {
      // ignore
    }
  }

  function addAfter() {
    if (rows.length >= 120 || rows.length === 0) {
      return;
    }
    try {
      const last = rows[rows.length - 1]!;
      const base = parseDateInput(last.dueDate);
      const row: PreviewChargeRow = {
        id: newPreviewRowId(),
        number: rows.length + 1,
        amountInput: last.amountInput,
        dueDate: toCalendarInputValue(addMonths(base, 1)),
        paid: false,
      };
      onChange(renumber([...rows, row]));
    } catch {
      // ignore
    }
  }

  function confirmRemove() {
    if (pendingRemove === null) {
      return;
    }
    if (pendingRemove === "last") {
      if (rows.length <= 1) {
        setPendingRemove(null);
        return;
      }
      onChange(renumber(rows.slice(0, -1)));
    } else {
      if (rows.length <= 1) {
        setPendingRemove(null);
        return;
      }
      onChange(cascadeDates(rows.filter((row) => row.id !== pendingRemove)));
    }
    setPendingRemove(null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = rows.findIndex((row) => row.id === active.id);
    const newIndex = rows.findIndex((row) => row.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onChange(cascadeDates(arrayMove(rows, oldIndex, newIndex)));
  }

  const removeLabel =
    pendingRemove === "last"
      ? "Remover a última cobrança?"
      : "Remover esta cobrança?";

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-line bg-white/50 p-3">
            {rows.map((row, index) => (
              <SortableChargeRow
                disabled={disabled}
                key={row.id}
                onAmountChange={(value) => updateAmount(index, value)}
                onDueDateChange={(value) => updateDueDate(index, value)}
                onRemove={() => setPendingRemove(row.id)}
                onTogglePaid={() => togglePaid(index)}
                removeDisabled={disabled || rows.length <= 1}
                row={row}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-center gap-2">
        <Tip content="Adiciona uma cobrança um mês antes da primeira.">
          <button
            aria-label="Adicionar antes"
            className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink/70 transition hover:border-pine hover:text-pine disabled:opacity-40"
            disabled={disabled || rows.length >= 120}
            onClick={addBefore}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:row-insert-top" />
          </button>
        </Tip>
        <Tip content="Adiciona uma cobrança um mês depois da última.">
          <button
            aria-label="Adicionar depois"
            className="inline-flex size-10 items-center justify-center rounded-full border border-pine/30 bg-pine-soft/40 text-pine-dark transition hover:bg-pine-soft disabled:opacity-40"
            disabled={disabled || rows.length >= 120}
            onClick={addAfter}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:plus" />
          </button>
        </Tip>
        <Tip content="Remove a última cobrança da lista.">
          <button
            aria-label="Remover última"
            className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink/70 transition hover:border-clay hover:text-clay disabled:opacity-40"
            disabled={disabled || rows.length <= 1}
            onClick={() => setPendingRemove("last")}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:minus" />
          </button>
        </Tip>
      </div>

      <ConfirmDialog
        cancelLabel="Manter"
        confirmLabel="Remover"
        danger
        description="Essa cobrança some da prévia. Você ainda pode voltar e montar de novo antes de confirmar."
        onCancel={() => setPendingRemove(null)}
        onConfirm={confirmRemove}
        open={pendingRemove !== null}
        title={removeLabel}
      />
    </>
  );
}

function SortableChargeRow({
  row,
  disabled,
  removeDisabled,
  onAmountChange,
  onDueDateChange,
  onTogglePaid,
  onRemove,
}: {
  row: PreviewChargeRow;
  disabled?: boolean;
  removeDisabled?: boolean;
  onAmountChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onTogglePaid: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li
      className="grid grid-cols-[auto_auto_auto_1fr_6.5rem_auto] items-center gap-1.5 rounded-xl px-1 py-1.5 sm:grid-cols-[auto_3.5rem_auto_1fr_8rem_auto] sm:gap-2"
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label="Arrastar cobrança"
        className="touch-none rounded-lg p-1 text-ink/35 hover:bg-line/50 hover:text-ink/70 disabled:opacity-40"
        disabled={disabled}
        type="button"
        {...attributes}
        {...listeners}
      >
        <AppIcon className="size-4" name="tabler:grip-vertical" />
      </button>
      <span className="text-sm font-medium text-ink/70">#{row.number}</span>
      <button
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          row.paid ? "bg-pine-soft text-pine-dark" : "bg-line/60 text-ink/55"
        }`}
        disabled={disabled}
        onClick={onTogglePaid}
        type="button"
      >
        {row.paid ? "Paga" : "Aberta"}
      </button>
      <DatePicker compact disabled={disabled} onChange={onDueDateChange} value={row.dueDate} />
      <input
        className="field py-2 text-right text-sm"
        disabled={disabled}
        onChange={(event) => onAmountChange(event.target.value)}
        value={row.amountInput}
      />
      <button
        aria-label="Remover cobrança"
        className="rounded-lg p-1.5 text-ink/35 transition hover:bg-clay/10 hover:text-clay disabled:opacity-40"
        disabled={removeDisabled}
        onClick={onRemove}
        type="button"
      >
        <AppIcon className="size-4" name="tabler:trash" />
      </button>
    </li>
  );
}
