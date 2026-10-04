import type { ReactNode } from "react";
import { PaidVersusDueChart, ScoreBarChart } from "@/components/dashboard/google-charts";
import { CountUpMoney } from "@/components/motion/count-up";
import { AppIcon } from "@/components/ui/icon";
import type { DashboardView } from "@/modules/debt/application/dashboard-view";
import { formatBRL } from "@/shared/utils/money";

export function Scoreboard({ data }: { data: DashboardView }) {
  if (data.shared) {
    return <SharedScoreboard data={data} />;
  }

  return <PersonalScoreboard data={data} />;
}

function PersonalScoreboard({ data }: { data: DashboardView }) {
  return (
    <article className="sheet overflow-hidden bg-gradient-to-br from-card via-card to-pine-soft/50" data-reveal>
      <p className="flex items-center gap-2 text-sm text-ink/55">
        <AppIcon name="tabler:trophy" className="size-4" />
        Seu placar
      </p>
      <div className="mt-2 grid items-center gap-4 lg:grid-cols-[220px_1fr]">
        <PaidVersusDueChart dueCents={data.totalDueCents} paidCents={data.paidTotalCents} />
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Pago no mês" value={<CountUpMoney cents={data.paidThisMonthCents} />} />
          <MiniStat label="Atrasadas" value={`${data.overdueCount}`} warn={data.overdueCount > 0} />
          <MiniStat label="Ainda falta" value={<CountUpMoney cents={data.totalDueCents} />} />
          <MiniStat label="Quitado" value={`${data.progressPercent}%`} />
        </div>
      </div>
    </article>
  );
}

function SharedScoreboard({ data }: { data: DashboardView }) {
  const leader = data.scores[0];

  return (
    <article className="sheet overflow-hidden bg-gradient-to-br from-card via-card to-pine-soft/40" data-reveal>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-ink/55">
          <AppIcon name="tabler:trophy" className="size-4" />
          Placar do mês
        </p>
        {leader && leader.paidThisMonthCents > 0 ? (
          <p className="rounded-full bg-pine-soft px-3 py-1 text-xs font-semibold text-pine-dark">
            {leader.firstName} na frente
          </p>
        ) : null}
      </div>
      <ScoreBarChart scores={data.scores} />
      <div className="-mx-2 mt-2 flex snap-x gap-3 overflow-x-auto px-2 sm:grid sm:grid-cols-2 sm:overflow-visible">
        {data.scores.map((score) => (
          <div className="min-w-[70%] snap-center rounded-2xl bg-white/80 p-3 sm:min-w-0" key={score.userId}>
            <p className="font-display text-lg">{score.firstName}</p>
            <p className="text-sm text-ink/55">
              Pagou {formatBRL(score.paidThisMonthCents)} · falta {formatBRL(score.remainingCents)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-xl ${warn ? "text-clay" : ""}`}>{value}</p>
    </div>
  );
}
