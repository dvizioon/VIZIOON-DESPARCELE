import { NextResponse } from "next/server";
import { tickLoanCron } from "@/modules/cron/application/tick-loan-cron";

/**
 * Disparo externo opcional (Coolify / crontab):
 * Authorization: Bearer $CRON_SECRET
 *
 * Enfileira dias devidos e processa a fila se o cron estiver ativo no admin.
 * Query ?force=1 processa mesmo desativado.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET nao configurado" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const result = await tickLoanCron({ forceProcess: force });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return POST(request);
}
