"use client";

import { useActionState, useState } from "react";
import { createDebtAction } from "@/app/actions/debt";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { NoteEditor } from "@/components/notes/note-editor";
import { SearchSelect } from "@/components/ui/search-select";
import type { WorkspaceMember } from "@/modules/workspace/domain/workspace";

const initial: ActionState = { error: null };

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
  const action = createDebtAction.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [note, setNote] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Nome</span>
        <input className="field" name="name" required placeholder="Cartão, financiamento, loja" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">Valor total</span>
          <input className="field" name="totalAmount" required placeholder="1200,00" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">Parcelas</span>
          <input className="field" name="installmentCount" type="number" min={1} max={360} required />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Valor da 1ª parcela (opcional)</span>
        <input className="field" name="firstAmount" placeholder="425,00" />
        <span className="mt-1 block text-xs text-ink/55">
          Se preencher, as outras fecham o total. Vazio = divide igual.
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Primeiro vencimento</span>
        <input className="field" name="firstDueDate" type="date" required defaultValue={defaultDueDate} />
      </label>
      {shared ? (
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">De quem é a dívida</span>
          <SearchSelect
            name="ownerId"
            options={members.map((member) => ({
              value: member.userId,
              label: member.userName,
              hint: member.userEmail,
            }))}
            placeholder="Escolher pessoa"
            searchPlaceholder="Buscar pelo nome"
            value={ownerId}
            onChange={setOwnerId}
          />
        </label>
      ) : (
        <input type="hidden" name="ownerId" value={currentUserId} />
      )}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
        <input className="mt-1 size-4 accent-[var(--pine)]" name="isLoan" type="checkbox" value="1" />
        <span>
          <span className="block text-sm font-medium text-ink">Empréstimo</span>
          <span className="mt-0.5 block text-xs text-ink/55">
            Desconta na conta todo mês. No vencimento a parcela fica paga sozinha.
          </span>
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Nota</span>
        <input name="note" type="hidden" value={note} />
        <NoteEditor
          height={220}
          placeholder="O que combina lembrar: acordo, loja, por que parcelou..."
          value={note}
          onChange={setNote}
        />
      </label>
      {state.error ? <FormError message={state.error} /> : null}
      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Gerar parcelas"}
      </button>
    </form>
  );
}
