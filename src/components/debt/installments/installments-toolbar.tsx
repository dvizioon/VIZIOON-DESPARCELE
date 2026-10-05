"use client";

import type { RefObject } from "react";
import { FilterPills } from "@/components/motion/filter-pills";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
import type { ListMode, StatusFilter, ViewMode } from "./types";
import { ViewChip } from "./view-chip";

export function InstallmentsToolbar({
  view,
  statusFilter,
  listMode,
  listConfigOpen,
  configRef,
  filteredCount,
  pageLabel,
  onViewChange,
  onFilterChange,
  onToggleConfig,
  onListModeChange,
}: {
  view: ViewMode;
  statusFilter: StatusFilter;
  listMode: ListMode;
  listConfigOpen: boolean;
  configRef: RefObject<HTMLDivElement | null>;
  filteredCount: number;
  pageLabel: string | null;
  onViewChange: (view: ViewMode) => void;
  onFilterChange: (filter: StatusFilter) => void;
  onToggleConfig: () => void;
  onListModeChange: (mode: ListMode) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterPills watch={view}>
          <ViewChip active={view === "list"} onClick={() => onViewChange("list")}>
            <AppIcon className="size-4" name="tabler:list" />
            Lista
          </ViewChip>
          <ViewChip active={view === "calendar"} onClick={() => onViewChange("calendar")}>
            <AppIcon className="size-4" name="tabler:calendar" />
            Calendário
          </ViewChip>
          <ViewChip active={view === "pipeline"} onClick={() => onViewChange("pipeline")}>
            <AppIcon className="size-4" name="tabler:layout-kanban" />
            Pipeline
          </ViewChip>
        </FilterPills>

        {view === "list" ? (
          <div className="relative" ref={configRef}>
            <button
              aria-label="Configurar lista"
              className="btn-ghost px-3 py-2"
              onClick={onToggleConfig}
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
                      onListModeChange("paged");
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
                      onListModeChange("infinite");
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <FilterPills watch={statusFilter}>
        <ViewChip active={statusFilter === "all"} onClick={() => onFilterChange("all")}>
          Todas
        </ViewChip>
        <ViewChip active={statusFilter === "open"} onClick={() => onFilterChange("open")}>
          Abertas
        </ViewChip>
        <ViewChip active={statusFilter === "paid"} onClick={() => onFilterChange("paid")}>
          Pagas
        </ViewChip>
        <ViewChip active={statusFilter === "overdue"} onClick={() => onFilterChange("overdue")}>
          Atrasadas
        </ViewChip>
      </FilterPills>

      <p className="text-xs text-ink/50">
        {filteredCount} parcela{filteredCount === 1 ? "" : "s"}
        {statusFilter !== "all" ? " no filtro" : ""}
        {pageLabel}
      </p>
    </div>
  );
}
