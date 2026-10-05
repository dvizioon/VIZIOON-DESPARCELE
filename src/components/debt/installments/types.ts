export type InstallmentListItem = {
  id: string;
  number: number;
  amountCents: number;
  dueDate: string;
  paid: boolean;
  paidByName: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  reminderDisabled: boolean;
};

export type ViewMode = "list" | "calendar" | "pipeline";
export type StatusFilter = "all" | "open" | "paid" | "overdue";
export type ListMode = "paged" | "infinite";
