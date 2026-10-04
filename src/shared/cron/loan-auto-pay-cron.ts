import { tickLoanCron } from "@/modules/cron/application/tick-loan-cron";

let started = false;
const TICK_MS = 60_000;

export function startLoanAutoPayCron() {
  if (started) {
    return;
  }
  started = true;

  void runTick("startup");

  setInterval(() => {
    void runTick("minute");
  }, TICK_MS);

  console.log("[loan-cron] worker a cada minuto (config no admin)");
}

async function runTick(reason: string) {
  try {
    const result = await tickLoanCron();
    if (result.enqueued > 0 || result.processed > 0 || result.paidTotal > 0) {
      console.log(
        `[loan-cron] ${reason}: +${result.enqueued} fila · ${result.processed} processada(s) · ${result.paidTotal} parcela(s)`,
      );
    }
  } catch (error) {
    console.error(`[loan-cron] ${reason} falhou`, error);
  }
}
