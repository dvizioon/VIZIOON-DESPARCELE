"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { addInstallmentAction, reorderInstallmentsAction } from "@/app/actions/debt";
import {
  FILTER_KEY,
  INFINITE_STEP,
  LIST_MODE_KEY,
  PAGE_SIZE,
  VIEW_KEY,
} from "./constants";
import type { InstallmentListItem, ListMode, StatusFilter, ViewMode } from "./types";
import { matchesFilter, splitPipeline } from "./utils";

export function useInstallmentsBoard({
  workspaceId,
  debtId,
  installments,
  canEdit,
}: {
  workspaceId: string;
  debtId: string;
  installments: InstallmentListItem[];
  canEdit: boolean;
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
  const pipeline = useMemo(() => splitPipeline(filtered), [filtered]);

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

  return {
    items,
    error,
    adding,
    view,
    statusFilter,
    listMode,
    listConfigOpen,
    page: safePage,
    visibleCount,
    highlightId,
    blinkId,
    configRef,
    filtered,
    totalPages,
    visibleItems,
    canDrag,
    pipeline,
    pageLabel:
      view === "list" && listMode === "paged" ? ` · página ${safePage} de ${totalPages}` : null,
    changeView,
    changeFilter,
    changeListMode,
    setListConfigOpen,
    setPage,
    setVisibleCount,
    onDragEnd,
    addOne,
  };
}
