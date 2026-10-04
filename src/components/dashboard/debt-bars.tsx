import { RemainingPieChart } from "@/components/dashboard/google-charts";
import { AppIcon } from "@/components/ui/icon";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";

export function DebtBars({ slices }: { slices: DashboardView["slices"] }) {
  return (
    <article className="sheet" data-reveal>
      <p className="mb-2 flex items-center gap-2 text-sm text-ink/55">
        <AppIcon name="tabler:chart-donut-3" className="size-4" />
        O que ainda pesa
      </p>
      <RemainingPieChart slices={slices} />
    </article>
  );
}
