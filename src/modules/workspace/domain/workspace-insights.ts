export interface WorkspaceInsights {
  createdAt: string;
  archivedAt: string | null;
  memberCount: number;
  adminCount: number;
  editorCount: number;
  viewerCount: number;
  debtCount: number;
  openDebtCount: number;
  settledDebtCount: number;
  installmentCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  paidThisMonthCount: number;
  paidThisMonthCents: number;
  paidTotalCents: number;
  remainingCents: number;
  totalAmountCents: number;
  progressPercent: number;
  noteCount: number;
  receiptCount: number;
  lastPaidAt: string | null;
  topPayerName: string | null;
  topPayerCount: number;
}
