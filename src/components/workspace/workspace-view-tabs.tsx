"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PillTrack } from "@/components/motion/pill-track";
import { AppIcon } from "@/components/ui/icon";
import { parseWorkspaceListView, type WorkspaceListView } from "@/modules/workspace/domain/workspace";

const TABS: { value: WorkspaceListView; label: string; shortLabel: string; icon: string }[] = [
  { value: "todos", label: "Todos", shortLabel: "Todos", icon: "tabler:stack-2" },
  { value: "arquivados", label: "Arquivados", shortLabel: "Arquivo", icon: "tabler:archive" },
  { value: "lixeira", label: "Lixeira", shortLabel: "Lixeira", icon: "tabler:trash" },
];

export function WorkspaceViewTabs({
  counts,
}: {
  counts: Record<WorkspaceListView, number>;
}) {
  const search = useSearchParams();
  const view = parseWorkspaceListView(search.get("view") ?? undefined);

  return (
    <PillTrack
      className="mb-5 flex w-full gap-1 rounded-full bg-white/80 p-1 shadow-sm"
      watch={view}
    >
      {TABS.map((tab) => {
        const href = tab.value === "todos" ? "/workspaces" : `/workspaces?view=${tab.value}`;
        const active = view === tab.value;

        return (
          <Link
            className={`nav-link relative z-10 flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm ${
              active ? "text-ink" : "text-ink/55"
            }`}
            data-pill-active={active ? "true" : "false"}
            href={href}
            key={tab.value}
          >
            <AppIcon name={tab.icon} className="size-4" />
            <span className="truncate sm:hidden">{tab.shortLabel}</span>
            <span className="hidden truncate sm:inline">{tab.label}</span>
            <span className={active ? "text-ink/45" : "text-ink/35"}>{counts[tab.value]}</span>
          </Link>
        );
      })}
    </PillTrack>
  );
}
