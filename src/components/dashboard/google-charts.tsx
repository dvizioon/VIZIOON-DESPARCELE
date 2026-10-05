"use client";

import { Chart } from "react-google-charts";
import { AppIcon } from "@/components/ui/icon";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";

const COLORS = ["#0c6b5c", "#c05621", "#2d6a4f", "#1a1612", "#8b5e34", "#4c7c6a"];

const baseOptions = {
  backgroundColor: "transparent",
  fontName: "Manrope",
  chartArea: { width: "88%", height: "72%" },
  legend: { position: "bottom", textStyle: { color: "#1a1612", fontSize: 12 } },
  tooltip: { textStyle: { fontSize: 13 } },
};

export function RemainingPieChart({ slices }: { slices: DashboardView["slices"] }) {
  const open = slices.filter((item) => item.remainingCents > 0);

  if (open.length === 0) {
    return <EmptyChart label="Nada em aberto para graficar" />;
  }

  const data: Array<[string, string | number]> = [
    ["Divida", "Valor"],
    ...open.map((item) => [item.name, item.remainingCents / 100] as [string, number]),
  ];

  return (
    <Chart
      chartType="PieChart"
      data={data}
      height="280px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        pieHole: 0.52,
        colors: COLORS,
        pieSliceText: "percentage",
        slices: open.map((_, index) => ({ color: COLORS[index % COLORS.length] })),
      }}
      width="100%"
    />
  );
}

export function PaidVersusDueChart({
  paidCents,
  dueCents,
}: {
  paidCents: number;
  dueCents: number;
}) {
  if (paidCents === 0 && dueCents === 0) {
    return <EmptyChart label="Sem valores ainda" />;
  }

  return (
    <Chart
      chartType="PieChart"
      data={[
        ["Status", "Valor"],
        ["Pago", paidCents / 100],
        ["Falta", dueCents / 100],
      ]}
      height="220px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        pieHole: 0.58,
        colors: ["#0c6b5c", "#c05621"],
        pieSliceText: "percentage",
        legend: { position: "none" },
      }}
      width="100%"
    />
  );
}

export function ScoreBarChart({ scores }: { scores: DashboardView["scores"] }) {
  if (scores.length === 0) {
    return <EmptyChart label="Sem pessoas no placar" />;
  }

  const data: Array<Array<string | number>> = [
    ["Pessoa", "Pago no mes", "Ainda falta"],
    ...scores.map((score) => [
      score.firstName,
      score.paidThisMonthCents / 100,
      score.remainingCents / 100,
    ]),
  ];

  return (
    <Chart
      chartType="BarChart"
      data={data}
      height="240px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        colors: ["#0c6b5c", "#c05621"],
        isStacked: false,
        hAxis: { minValue: 0, textStyle: { fontSize: 11 } },
        vAxis: { textStyle: { fontSize: 12 } },
        legend: { position: "bottom", textStyle: { fontSize: 12 } },
      }}
      width="100%"
    />
  );
}

const KIND_LABEL: Record<string, string> = {
  INSTALLMENT: "Parcelada",
  RECURRING: "Recorrente",
  VARIABLE: "Variável",
};

/** Mix do que ainda falta por tipo de dívida. */
export function KindMixChart({ slices }: { slices: DashboardView["slices"] }) {
  const totals = new Map<string, number>();
  for (const item of slices) {
    if (item.remainingCents <= 0) {
      continue;
    }
    const key = item.kind ?? "INSTALLMENT";
    totals.set(key, (totals.get(key) ?? 0) + item.remainingCents);
  }

  if (totals.size === 0) {
    return <EmptyChart label="Nada em aberto por tipo" />;
  }

  const data: Array<[string, string | number]> = [
    ["Tipo", "Valor"],
    ...[...totals.entries()].map(
      ([kind, cents]) => [KIND_LABEL[kind] ?? kind, cents / 100] as [string, number],
    ),
  ];

  return (
    <Chart
      chartType="PieChart"
      data={data}
      height="260px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        pieHole: 0.48,
        colors: ["#0c6b5c", "#2d6a4f", "#8b5e34", "#c05621"],
        pieSliceText: "percentage",
      }}
      width="100%"
    />
  );
}

/** Em dia vs atrasado (parcelas pendentes). */
export function AgendaStatusChart({ upcoming }: { upcoming: DashboardView["upcoming"] }) {
  const overdue = upcoming.filter((item) => item.overdue).reduce((sum, item) => sum + item.amountCents, 0);
  const onTime = upcoming
    .filter((item) => !item.overdue)
    .reduce((sum, item) => sum + item.amountCents, 0);

  if (overdue === 0 && onTime === 0) {
    return <EmptyChart label="Sem parcelas na agenda" />;
  }

  return (
    <Chart
      chartType="PieChart"
      data={[
        ["Status", "Valor"],
        ["Em dia", onTime / 100],
        ["Atrasado", overdue / 100],
      ]}
      height="260px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        pieHole: 0.5,
        colors: ["#0c6b5c", "#c05621"],
        pieSliceText: "percentage",
      }}
      width="100%"
    />
  );
}

/** Barras: próximas parcelas do mês (top 8). */
export function MonthUpcomingColumnChart({
  upcoming,
}: {
  upcoming: DashboardView["upcoming"];
}) {
  const now = new Date();
  const monthItems = upcoming
    .filter((item) => {
      const due = new Date(item.dueDate);
      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
    })
    .slice(0, 8);

  if (monthItems.length === 0) {
    return <EmptyChart label="Nada vence neste mês" />;
  }

  const data: Array<Array<string | number | object>> = [
    ["Divida", "Valor", { role: "style" }],
    ...monthItems.map((item) => [
      item.debtName.length > 14 ? `${item.debtName.slice(0, 12)}…` : item.debtName,
      item.amountCents / 100,
      item.overdue ? "#c05621" : "#0c6b5c",
    ]),
  ];

  return (
    <Chart
      chartType="ColumnChart"
      data={data}
      height="280px"
      loader={<ChartLoader />}
      options={{
        ...baseOptions,
        legend: { position: "none" },
        hAxis: { textStyle: { fontSize: 11 } },
        vAxis: { minValue: 0, textStyle: { fontSize: 11 } },
      }}
      width="100%"
    />
  );
}

function ChartLoader() {
  return <div className="h-48 animate-pulse rounded-2xl bg-line/70" />;
}

function EmptyChart({ label }: { label: string }) {
  return (
    <p className="flex h-48 items-center justify-center gap-2 text-sm text-ink/55">
      <AppIcon name="tabler:chart-donut" className="size-5" />
      {label}
    </p>
  );
}
