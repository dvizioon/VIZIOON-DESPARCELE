export type LoanCronSettings = {
  enabled: boolean;
  hour: number;
  updatedAt: Date | null;
};

export type RecurringCronSettings = {
  enabled: boolean;
  hour: number;
};

export type ReminderCronSettings = {
  enabled: boolean;
  hour: number;
  daysBefore: number;
};

export type SystemCronSettings = {
  loan: LoanCronSettings;
  recurring: RecurringCronSettings;
  reminder: ReminderCronSettings;
  updatedAt: Date | null;
};

export type CronTaskTypeView =
  | "LOAN_AUTO_PAY"
  | "RECURRING_GENERATE"
  | "INSTALLMENT_REMINDER";

export type CronTaskView = {
  id: string;
  type: CronTaskTypeView;
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
