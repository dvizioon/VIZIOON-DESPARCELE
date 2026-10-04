"use client";

import { DebtCreateForm, type DebtCreateMember } from "@/components/forms/debt-create-form";
import type { WorkspaceMember } from "@/modules/workspace/domain/workspace";

type DebtFormProps = {
  workspaceId: string;
  members: WorkspaceMember[];
  currentUserId: string;
  defaultDueDate: string;
  shared: boolean;
};

export function DebtForm({
  workspaceId,
  members,
  currentUserId,
  defaultDueDate,
  shared,
}: DebtFormProps) {
  const mapped: DebtCreateMember[] = members.map((member) => ({
    userId: member.userId,
    userName: member.userName,
    userEmail: member.userEmail,
  }));

  return (
    <DebtCreateForm
      currentUserId={currentUserId}
      defaultDueDate={defaultDueDate}
      members={mapped}
      shared={shared}
      workspaceId={workspaceId}
    />
  );
}
