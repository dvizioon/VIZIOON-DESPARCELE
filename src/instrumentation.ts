export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { startLoanAutoPayCron } = await import("@/shared/cron/loan-auto-pay-cron");
  startLoanAutoPayCron();
}
