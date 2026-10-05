"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Willow } from "@svar-ui/react-calendar";
import type { CalendarEvent } from "@svar-ui/react-calendar";
import "@svar-ui/react-calendar/all.css";
import { formatBRL } from "@/shared/utils/money";

type CalendarInstallment = {
  id: string;
  number: number;
  amountCents: number;
  dueDate: string;
  paid: boolean;
};

function parseItemDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`);
}

function toLocalDay(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 9, 0, 0, 0);
}

export function InstallmentsSvarCalendar({
  items,
  highlightId,
}: {
  items: CalendarInstallment[];
  highlightId: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const events = useMemo<CalendarEvent[]>(() => {
    return items.map((item) => {
      const start = toLocalDay(parseItemDate(item.dueDate));
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return {
        id: item.id,
        start,
        end,
        allDay: true,
        text: `#${item.number} · ${formatBRL(item.amountCents)}${item.paid ? " · paga" : ""}`,
        paid: item.paid,
        isNew: item.id === highlightId,
      };
    });
  }, [items, highlightId]);

  const date = useMemo(() => {
    const highlighted = items.find((item) => item.id === highlightId);
    const firstOpen = items.find((item) => !item.paid);
    const base = highlighted ?? firstOpen ?? items[0];
    return base ? toLocalDay(parseItemDate(base.dueDate)) : new Date();
  }, [items, highlightId]);

  if (!mounted) {
    return (
      <div className="flex h-[min(40rem,70vh)] w-full items-center justify-center rounded-3xl border border-line bg-white/60 text-sm text-ink/50">
        Carregando calendário…
      </div>
    );
  }

  return (
    <div className="installments-svar-calendar h-[min(40rem,70vh)] w-full overflow-hidden rounded-3xl border border-line bg-white">
      <Willow>
        <Calendar
          date={date}
          eventCss={(ctx) => {
            const classes = ["desparcele-event"];
            if (ctx.event.paid) {
              classes.push("desparcele-event-paid");
            } else {
              classes.push("desparcele-event-open");
            }
            if (ctx.event.isNew || ctx.event.id === highlightId) {
              classes.push("desparcele-event-new");
            }
            return classes.join(" ");
          }}
          events={events}
          readonly
          view="month"
          views={["month", "week", "day"]}
        />
      </Willow>
    </div>
  );
}
