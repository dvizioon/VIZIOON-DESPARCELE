import { startLoanAutoPayCron } from "@/shared/cron/loan-auto-pay-cron";

export function startNodeInstrumentation() {
  startLoanAutoPayCron();
}
