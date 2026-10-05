"use client";

import { useEffect, useRef } from "react";
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
import type { InstallmentListItem, InstallmentMemberOption, ListMode } from "./types";

function InstallmentSkeleton() {
  return (
    <li className="sheet animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded-full bg-line/80" />
          <div className="h-3 w-48 rounded-full bg-line/60" />
        </div>
        <div className="h-7 w-20 rounded-xl bg-line/70" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full bg-line/55" />
        <div className="h-8 w-20 rounded-full bg-line/45" />
      </div>
    </li>
  );
}

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
  pageSize,
  totalPages,
  hasMore,
  loadingMore,
  members,
  currentUserId,
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
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  loadingMore: boolean;
  members: InstallmentMemberOption[];
  currentUserId: string;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listMode !== "infinite" || !hasMore) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "160px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [listMode, hasMore, onLoadMore, items.length]);

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
                  currentUserId={currentUserId}
                  debtId={debtId}
                  isNew={highlightId === item.id}
                  item={item}
                  key={item.id}
                  members={members}
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
              currentUserId={currentUserId}
              debtId={debtId}
              isNew={highlightId === item.id}
              item={item}
              key={item.id}
              members={members}
              remindersOnDebt={remindersOnDebt}
              workspaceId={workspaceId}
            />
          ))}
        </ul>
      )}

      {listMode === "paged" && totalCount > pageSize ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-1 px-3 py-2"
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
            className="btn-ghost inline-flex items-center gap-1 px-3 py-2"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            type="button"
          >
            Próxima
            <AppIcon className="size-4" name="tabler:chevron-right" />
          </button>
        </div>
      ) : null}

      {listMode === "infinite" && (hasMore || loadingMore) ? (
        <div className="space-y-3" ref={sentinelRef}>
          {(loadingMore || hasMore) && (
            <ul className="grid gap-3" aria-hidden={!loadingMore}>
              <InstallmentSkeleton />
              {loadingMore ? <InstallmentSkeleton /> : null}
            </ul>
          )}
          <p className="text-center text-xs text-ink/40">
            {loadingMore ? "Carregando mais…" : "Role para carregar mais"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
