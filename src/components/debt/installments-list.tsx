"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { formatDateFull } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

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

  useEffect(() => {
    setItems(installments);
  }, [installments]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    if (!canEdit) {
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
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {canEdit ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            aria-label="Adicionar parcela"
            className="inline-flex size-10 items-center justify-center rounded-full border border-pine/30 bg-pine-soft/40 text-pine-dark transition hover:bg-pine-soft disabled:opacity-40"
            disabled={adding || items.length >= 360}
            onClick={() => void addOne()}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:plus" />
          </button>
        </div>
      ) : null}

      {error ? <FormError message={error} /> : null}

      {canEdit ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-3">
              {items.map((item) => (
                <SortableInstallmentCard
                  canDelete={items.length > 1}
                  debtId={debtId}
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
            <li className="sheet" key={item.id}>
              <InstallmentCardBody item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortableInstallmentCard({
  item,
  canDelete,
  workspaceId,
  debtId,
  remindersOnDebt,
}: {
  item: InstallmentListItem;
  canDelete: boolean;
  workspaceId: string;
  debtId: string;
  remindersOnDebt: boolean;
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
    <li className="sheet" ref={setNodeRef} style={style}>
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
      <InstallmentCardBody item={item} />
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

function InstallmentCardBody({ item }: { item: InstallmentListItem }) {
  const due = new Date(item.dueDate.includes("T") ? item.dueDate : `${item.dueDate}T12:00:00.000Z`);
  const paidAt = item.paidAt
    ? new Date(item.paidAt.includes("T") ? item.paidAt : `${item.paidAt}T12:00:00.000Z`)
    : null;

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
        </p>
        <p className="mt-1 text-sm text-ink/55">Vence {formatDateFull(due)}</p>
        {item.paid ? (
          <p className="mt-1 text-sm text-moss">
            Paga por {item.paidByName ?? "alguem"}
            {paidAt ? ` em ${formatDateFull(paidAt)}` : ""}
          </p>
        ) : null}
      </div>
      <p className="font-display text-2xl">{formatBRL(item.amountCents)}</p>
    </div>
  );
}
