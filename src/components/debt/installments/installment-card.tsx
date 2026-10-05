"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { InstallmentActions } from "@/components/forms/installment-actions";
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { formatDateFull } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";
import type { InstallmentListItem, InstallmentMemberOption } from "./types";
import { parseItemDate } from "./utils";

export function InstallmentCardBody({
  item,
  isNew = false,
  compact = false,
}: {
  item: InstallmentListItem;
  isNew?: boolean;
  compact?: boolean;
}) {
  const due = parseItemDate(item.dueDate);
  const paidAt = item.paidAt ? parseItemDate(item.paidAt) : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <AppIcon
            name={item.paid ? "tabler:circle-check" : "tabler:clock"}
            className={item.paid ? "size-5 text-moss" : "size-5 text-clay"}
          />
          Parcela {item.number}
          <MonthBadge date={due} />
          {isNew ? (
            <span className="rounded-full bg-pine px-2 py-0.5 text-[11px] font-semibold text-white">
              Nova
            </span>
          ) : null}
        </p>
        {!compact ? (
          <>
            <p className="mt-1 text-sm text-ink/55">Vence {formatDateFull(due)}</p>
            {item.paid ? (
              <p className="mt-1 text-sm text-moss">
                Paga por {item.paidByName ?? "alguem"}
                {paidAt ? ` em ${formatDateFull(paidAt)}` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-xs text-ink/55">{formatDateFull(due)}</p>
        )}
      </div>
      <p className={`font-display ${compact ? "text-lg" : "text-2xl"}`}>
        {formatBRL(item.amountCents)}
      </p>
    </div>
  );
}

export function SortableInstallmentCard({
  item,
  canDelete,
  workspaceId,
  debtId,
  remindersOnDebt,
  members,
  currentUserId,
  isNew,
  blink,
}: {
  item: InstallmentListItem;
  canDelete: boolean;
  workspaceId: string;
  debtId: string;
  remindersOnDebt: boolean;
  members: InstallmentMemberOption[];
  currentUserId: string;
  isNew: boolean;
  blink: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li
      className={`sheet ${blink ? "installment-blink" : ""}`}
      id={`installment-${item.id}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="mb-2">
        <button
          aria-label="Arrastar parcela"
          className="touch-none rounded-lg p-1 text-ink/35 hover:bg-line/50 hover:text-ink/70"
          type="button"
          {...attributes}
          {...listeners}
        >
          <AppIcon className="size-4" name="tabler:grip-vertical" />
        </button>
      </div>
      <InstallmentCardBody isNew={isNew} item={item} />
      <InstallmentActions
        canDelete={canDelete}
        currentUserId={currentUserId}
        debtId={debtId}
        installmentId={item.id}
        members={members}
        paid={item.paid}
        paidByUserId={item.paidByUserId}
        receiptUrl={item.receiptUrl}
        reminderDisabled={item.reminderDisabled}
        remindersOnDebt={remindersOnDebt}
        workspaceId={workspaceId}
      />
    </li>
  );
}

export function StaticInstallmentCard({
  item,
  canEdit,
  canDelete,
  workspaceId,
  debtId,
  remindersOnDebt,
  members,
  currentUserId,
  isNew,
  blink,
}: {
  item: InstallmentListItem;
  canEdit: boolean;
  canDelete: boolean;
  workspaceId: string;
  debtId: string;
  remindersOnDebt: boolean;
  members: InstallmentMemberOption[];
  currentUserId: string;
  isNew: boolean;
  blink: boolean;
}) {
  return (
    <li className={`sheet ${blink ? "installment-blink" : ""}`} id={`installment-${item.id}`}>
      <InstallmentCardBody isNew={isNew} item={item} />
      {canEdit ? (
        <InstallmentActions
          canDelete={canDelete}
          currentUserId={currentUserId}
          debtId={debtId}
          installmentId={item.id}
          members={members}
          paid={item.paid}
          paidByUserId={item.paidByUserId}
          receiptUrl={item.receiptUrl}
          reminderDisabled={item.reminderDisabled}
          remindersOnDebt={remindersOnDebt}
          workspaceId={workspaceId}
        />
      ) : null}
    </li>
  );
}
