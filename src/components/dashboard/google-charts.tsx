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
