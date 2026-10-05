"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AppIcon } from "@/components/ui/icon";
import { SortableInstallmentCard, StaticInstallmentCard } from "./installment-card";
import { INFINITE_STEP, PAGE_SIZE } from "./constants";
import type { InstallmentListItem, ListMode } from "./types";

export function InstallmentsListView({
  items,
  totalCount,
  canEdit,
  canDrag,
  canDelete,
  workspaceId,
  debtId,
  remindersOnDebt,
  highlightId,
  blinkId,
  listMode,
  page,
  totalPages,
  visibleCount,
  onPageChange,
  onLoadMore,
  onDragEnd,
}: {
  items: InstallmentListItem[];
  totalCount: number;
  canEdit: boolean;
  canDrag: boolean;
  canDelete: boolean;
  workspaceId: string;
  debtId: string;
  remindersOnDebt: boolean;
  highlightId: string | null;
  blinkId: string | null;
  listMode: ListMode;
  page: number;
  totalPages: number;
  visibleCount: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (totalCount === 0) {
    return <div className="sheet text-sm text-ink/55">Nenhuma parcela neste filtro.</div>;
  }

  return (
    <div className="space-y-3">
      {canDrag ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-3">
              {items.map((item) => (
                <SortableInstallmentCard
                  blink={blinkId === item.id}
                  canDelete={canDelete}
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
            <StaticInstallmentCard
              blink={blinkId === item.id}
              canDelete={canDelete}
              canEdit={canEdit}
              debtId={debtId}
              isNew={highlightId === item.id}
              item={item}
              key={item.id}
              remindersOnDebt={remindersOnDebt}
              workspaceId={workspaceId}
            />
          ))}
        </ul>
      )}

      {listMode === "paged" && totalCount > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="btn-ghost px-3 py-2"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            type="button"
          >
            <AppIcon className="size-4" name="tabler:chevron-left" />
            Anterior
          </button>
          <span className="text-sm text-ink/60">
            {page} / {totalPages}
          </span>
          <button
            className="btn-ghost px-3 py-2"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            type="button"
          >
            Próxima
            <AppIcon className="size-4" name="tabler:chevron-right" />
          </button>
        </div>
      ) : null}

      {listMode === "infinite" && visibleCount < totalCount ? (
        <div className="flex justify-center">
          <button className="btn-ghost" onClick={onLoadMore} type="button">
            Carregar mais (+{INFINITE_STEP})
          </button>
        </div>
      ) : null}
    </div>
  );
}
