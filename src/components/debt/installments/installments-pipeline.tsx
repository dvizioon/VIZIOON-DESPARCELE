"use client";

import { InstallmentCardBody } from "./installment-card";
import type { InstallmentListItem } from "./types";

export function InstallmentsPipeline({
  overdue,
  open,
  paid,
  highlightId,
  blinkId,
}: {
  overdue: InstallmentListItem[];
  open: InstallmentListItem[];
  paid: InstallmentListItem[];
  highlightId: string | null;
  blinkId: string | null;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <PipelineColumn
        blinkId={blinkId}
        highlightId={highlightId}
        items={overdue}
        title="Atrasadas"
        tone="clay"
      />
      <PipelineColumn
        blinkId={blinkId}
        highlightId={highlightId}
        items={open}
        title="Em aberto"
        tone="ink"
      />
      <PipelineColumn
        blinkId={blinkId}
        highlightId={highlightId}
        items={paid}
        title="Pagas"
        tone="moss"
      />
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
