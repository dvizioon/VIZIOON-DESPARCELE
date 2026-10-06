"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { addInstallmentAction, reorderInstallmentsAction } from "@/app/actions/debt";
import {
  DEFAULT_PAGE_SIZE,
  FILTER_KEY,
  INFINITE_STEP,
  LIST_MODE_KEY,
  PAGE_SIZE_KEY,
  PAGE_SIZE_OPTIONS,
  VIEW_KEY,
} from "./constants";
import type { InstallmentListItem, ListMode, StatusFilter, ViewMode } from "./types";
import { matchesFilter, findMonthInstallmentIndex, splitPipeline } from "./utils";

function parsePageSize(value: string | null): number {
  const n = Number(value);
  if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) {
    return n;
  }
  return DEFAULT_PAGE_SIZE;
}

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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INFINITE_STEP);
  const [loadingMore, setLoadingMore] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [blinkId, setBlinkId] = useState<string | null>(null);
  const [monthPageSeeded, setMonthPageSeeded] = useState(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setPageSize(parsePageSize(localStorage.getItem(PAGE_SIZE_KEY)));
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
    setVisibleCount(INFINITE_STEP);
    setLoadingMore(false);
    setMonthPageSeeded(false);
  }, [statusFilter, listMode, pageSize]);

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item, statusFilter)),
    [items, statusFilter],
  );

  // Abre na página da parcela do mês (não sempre na 1)
  useEffect(() => {
    if (listMode !== "paged" || view !== "list" || monthPageSeeded || filtered.length === 0) {
      return;
    }
    const index = findMonthInstallmentIndex(filtered);
    setPage(Math.floor(index / pageSize) + 1);
    setMonthPageSeeded(true);
  }, [filtered, listMode, view, pageSize, monthPageSeeded]);

  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const index = filtered.findIndex((item) => item.id === highlightId);
    if (index < 0) {
      return;
    }
    if (listMode === "paged") {
      setPage(Math.floor(index / pageSize) + 1);
    } else {
      setVisibleCount((count) => Math.max(count, index + 1));
    }
  }, [highlightId, filtered, listMode, pageSize]);

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
      if (loadTimer.current) {
        clearTimeout(loadTimer.current);
      }
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const visibleItems = useMemo(() => {
    if (view !== "list") {
      return filtered;
    }
    if (listMode === "infinite") {
      return filtered.slice(0, visibleCount);
    }
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, view, listMode, visibleCount, safePage, pageSize]);

  const canDrag = canEdit && view === "list" && statusFilter === "all" && listMode === "infinite";
  const pipeline = useMemo(() => splitPipeline(filtered), [filtered]);
  const hasMore = listMode === "infinite" && visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) {
      return;
    }
    setLoadingMore(true);
    if (loadTimer.current) {
      clearTimeout(loadTimer.current);
    }
    loadTimer.current = setTimeout(() => {
      setVisibleCount((count) => Math.min(count + INFINITE_STEP, filtered.length));
      setLoadingMore(false);
    }, 280);
  }, [hasMore, loadingMore, filtered.length]);

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

  function changePageSize(next: number) {
    if (!(PAGE_SIZE_OPTIONS as readonly number[]).includes(next)) {
      return;
    }
    setPageSize(next);
    setPage(1);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(next));
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
    pageSize,
    page: safePage,
    visibleCount,
    loadingMore,
    hasMore,
    highlightId,
    blinkId,
    configRef,
    filtered,
    totalPages,
    visibleItems,
    canDrag,
    pipeline,
    pageLabel:
      view === "list" && listMode === "paged"
        ? ` · página ${safePage} de ${totalPages} · ${pageSize}/pág`
        : null,
    changeView,
    changeFilter,
    changeListMode,
    changePageSize,
    setListConfigOpen,
    setPage,
    loadMore,
    onDragEnd,
    addOne,
  };
}
