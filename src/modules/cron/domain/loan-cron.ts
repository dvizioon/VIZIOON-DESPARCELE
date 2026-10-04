export type LoanCronSettings = {
  enabled: boolean;
  hour: number;
  updatedAt: Date | null;
};

export type CronTaskView = {
  id: string;
  type: "LOAN_AUTO_PAY";
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  runDate: string;
  scheduledFor: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  paidCount: number | null;
  message: string | null;
  error: string | null;
  createdAt: Date;
};

export type CronQueueSummary = {
  pending: number;
  running: number;
  done: number;
  failed: number;
};
