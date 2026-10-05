"use client";

import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { InstallmentsCalendar } from "./installments-calendar";
import { InstallmentsListView } from "./installments-list-view";
import { InstallmentsPipeline } from "./installments-pipeline";
import { InstallmentsToolbar } from "./installments-toolbar";
import type { InstallmentListItem, InstallmentMemberOption } from "./types";
import { useInstallmentsBoard } from "./use-installments-board";

export type { InstallmentListItem } from "./types";

export function InstallmentsList({
  workspaceId,
  debtId,
  installments,
  canEdit,
  remindersOnDebt,
  members,
  currentUserId,
}: {
  workspaceId: string;
  debtId: string;
  installments: InstallmentListItem[];
  canEdit: boolean;
  remindersOnDebt: boolean;
  members: InstallmentMemberOption[];
  currentUserId: string;
}) {
  const board = useInstallmentsBoard({
    workspaceId,
    debtId,
    installments,
    canEdit,
  });

  return (
    <div className="space-y-3">
      <InstallmentsToolbar
        configRef={board.configRef}
        filteredCount={board.filtered.length}
        listConfigOpen={board.listConfigOpen}
        listMode={board.listMode}
        pageLabel={board.pageLabel}
        pageSize={board.pageSize}
        statusFilter={board.statusFilter}
        view={board.view}
        onFilterChange={board.changeFilter}
        onListModeChange={board.changeListMode}
        onPageSizeChange={board.changePageSize}
        onToggleConfig={() => board.setListConfigOpen((open) => !open)}
        onViewChange={board.changeView}
      />

      {board.error ? <FormError message={board.error} /> : null}

      {board.view === "list" ? (
        <InstallmentsListView
          blinkId={board.blinkId}
          canDelete={board.items.length > 1}
          canDrag={board.canDrag}
          canEdit={canEdit}
          currentUserId={currentUserId}
          debtId={debtId}
          hasMore={board.hasMore}
          highlightId={board.highlightId}
          items={board.visibleItems}
          listMode={board.listMode}
          loadingMore={board.loadingMore}
          members={members}
          page={board.page}
          pageSize={board.pageSize}
          remindersOnDebt={remindersOnDebt}
          totalCount={board.filtered.length}
          totalPages={board.totalPages}
          workspaceId={workspaceId}
          onDragEnd={board.onDragEnd}
          onLoadMore={board.loadMore}
          onPageChange={board.setPage}
        />
      ) : null}

      {board.view === "calendar" ? (
        <InstallmentsCalendar highlightId={board.highlightId} items={board.filtered} />
      ) : null}

      {board.view === "pipeline" ? (
        board.filtered.length === 0 ? (
          <div className="sheet text-sm text-ink/55">Nenhuma parcela neste filtro.</div>
        ) : (
          <InstallmentsPipeline
            blinkId={board.blinkId}
            highlightId={board.highlightId}
            open={board.pipeline.open}
            overdue={board.pipeline.overdue}
            paid={board.pipeline.paid}
          />
        )
      ) : null}

      {canEdit ? (
        <div className="flex justify-center pt-1">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-pine/30 bg-pine-soft/40 px-5 py-3 text-sm font-medium text-pine-dark shadow-sm transition hover:bg-pine-soft disabled:opacity-40"
            disabled={board.adding || board.items.length >= 360}
            onClick={() => void board.addOne()}
            type="button"
          >
            <AppIcon className="size-5" name="tabler:plus" />
            {board.adding ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
