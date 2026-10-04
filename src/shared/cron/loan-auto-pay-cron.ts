import cron from "node-cron";
import { tickLoanCron } from "@/modules/cron/application/tick-loan-cron";

let started = false;

/**
 * Worker interno: a cada minuto enfileira dias devidos e processa a fila
 * se o admin deixou o cron ativo em SystemConfig.
 */
export function startLoanAutoPayCron() {
  if (started) {
    return;
  }
  started = true;

  void runTick("startup");

  cron.schedule("* * * * *", () => {
    void runTick("minute");
  });

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
