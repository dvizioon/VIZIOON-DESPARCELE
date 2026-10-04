import { AppIcon } from "@/components/ui/icon";
import { UsageMeter } from "@/components/ui/usage-meter";
import type { WorkspaceInsights } from "@/modules/workspace/domain/workspace-insights";
import { formatDateFull } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

export function WorkspaceInsightsPanel({
  insights,
  shared,
}: {
  insights: WorkspaceInsights;
  shared: boolean;
}) {
  const created = formatDateFull(new Date(insights.createdAt));
  const lastPaid = insights.lastPaidAt ? formatDateFull(new Date(insights.lastPaidAt)) : "Nenhum ainda";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-pine-soft/80 via-white to-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/45">Uso do espaço</p>
            <p className="mt-1 font-display text-3xl">{insights.progressPercent}%</p>
            <p className="mt-1 text-sm text-ink/55">
              {formatBRL(insights.paidTotalCents)} quitado de {formatBRL(insights.totalAmountCents)}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-pine-dark">
            Desde {created}
          </span>
        </div>
        <UsageMeter
          paidLabel={`${formatBRL(insights.paidTotalCents)} quitado`}
          percent={insights.progressPercent}
          remainingLabel={`${formatBRL(insights.remainingCents)} a pagar`}
        />
        <p className="mt-2 text-xs text-ink/50">
          {insights.pendingCount} parcela{insights.pendingCount === 1 ? "" : "s"} em aberto
          {insights.overdueCount > 0
            ? ` · ${insights.overdueCount} atrasada${insights.overdueCount === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <InsightTile
          icon="tabler:users"
          label="Pessoas"
          value={`${insights.memberCount}`}
          hint={peopleHint(insights, shared)}
        />
        <InsightTile
          icon="tabler:cash"
          label="Pagamentos"
          value={`${insights.paidCount}`}
          hint={
            insights.paidThisMonthCount > 0
              ? `${insights.paidThisMonthCount} neste mês · ${formatBRL(insights.paidThisMonthCents)}`
              : "Nenhum neste mês"
          }
        />
        <InsightTile
          icon="tabler:list-details"
          label="Dívidas"
          value={`${insights.debtCount}`}
          hint={
            insights.debtCount === 0
              ? "Nenhuma cadastrada"
              : `${insights.openDebtCount} aberta${insights.openDebtCount === 1 ? "" : "s"}`
          }
        />
        <InsightTile
          icon="tabler:circle-check"
          label="Quitado"
          value={formatBRL(insights.paidTotalCents)}
          hint={`${insights.settledDebtCount} dívida${insights.settledDebtCount === 1 ? "" : "s"} fechada${insights.settledDebtCount === 1 ? "" : "s"}`}
        />
        <InsightTile
          icon="tabler:clock-hour-4"
          label="A pagar"
          value={formatBRL(insights.remainingCents)}
          hint={`${insights.pendingCount} parcela${insights.pendingCount === 1 ? "" : "s"}`}
          warn={insights.overdueCount > 0}
        />
        <InsightTile
          icon="tabler:alert-triangle"
          label="Atrasadas"
          value={`${insights.overdueCount}`}
          hint={insights.overdueCount > 0 ? "Precisam de atenção" : "Em dia"}
          warn={insights.overdueCount > 0}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <ActivityChip icon="tabler:notes" label="Notas" value={`${insights.noteCount}`} />
        <ActivityChip icon="tabler:paperclip" label="Comprovantes" value={`${insights.receiptCount}`} />
        <ActivityChip icon="tabler:calendar-check" label="Último pagamento" value={lastPaid} />
      </div>

      {shared && insights.topPayerName ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-pine-soft text-pine-dark">
            <AppIcon name="tabler:trophy" className="size-5" />
          </span>
          <div>
            <p className="text-xs text-ink/50">Quem mais pagou</p>
            <p className="font-medium">
              {insights.topPayerName}
              <span className="ml-2 text-sm font-normal text-ink/55">
                {insights.topPayerCount} pagamento{insights.topPayerCount === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function peopleHint(insights: WorkspaceInsights, shared: boolean): string {
  if (!shared) {
    return "Espaço pessoal";
  }

  const parts: string[] = [];
  if (insights.adminCount > 0) {
    parts.push(`${insights.adminCount} admin`);
  }
  if (insights.editorCount > 0) {
    parts.push(`${insights.editorCount} editor${insights.editorCount === 1 ? "" : "es"}`);
  }
  if (insights.viewerCount > 0) {
    parts.push(`${insights.viewerCount} leitura`);
  }

  return parts.join(" · ") || "Compartilhado";
}

function InsightTile({
  icon,
  label,
  value,
  hint,
  warn = false,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-line bg-white/80 p-3">
      <p className="flex items-center gap-1.5 text-xs text-ink/50">
        <AppIcon name={icon} className="size-3.5" />
        {label}
      </p>
      <p className={`mt-1 font-display text-xl leading-none ${warn ? "text-clay" : ""}`}>{value}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-ink/50">{hint}</p>
    </article>
  );
}

function ActivityChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2">
      <AppIcon name={icon} className="size-4 text-ink/45" />
      <div className="min-w-0">
        <p className="text-[11px] text-ink/45">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
