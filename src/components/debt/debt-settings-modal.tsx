"use client";

import { useState } from "react";
import {
  deleteDebtAction,
  renameDebtAction,
  setDebtAutoPayAction,
  setDebtRecurringPausedAction,
  setDebtRemindersAction,
  setDebtVisibilityAction,
} from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { useDialogMotion } from "@/components/motion/use-dialog-motion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";
import { LabelWithTip } from "@/components/ui/tip";
import type { DebtHideMode, DebtKind } from "@/modules/debt/domain/debt";

type MemberOption = {
  userId: string;
  userName: string;
};

export function DebtSettingsModal({
  workspaceId,
  debtId,
  debtName,
  autoPay,
  remindersEnabled = false,
  kind = "INSTALLMENT",
  recurringPaused = false,
  hideMode = "NONE",
  hiddenUserIds = [],
  canManageVisibility = false,
  shared = false,
  currentUserId,
  members = [],
}: {
  workspaceId: string;
  debtId: string;
  debtName: string;
  autoPay: boolean;
  remindersEnabled?: boolean;
  kind?: DebtKind;
  recurringPaused?: boolean;
  hideMode?: DebtHideMode;
  hiddenUserIds?: string[];
  canManageVisibility?: boolean;
  shared?: boolean;
  currentUserId?: string;
  members?: MemberOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full p-2 text-ink/50 transition hover:bg-white hover:text-ink"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        type="button"
      >
        <AppIcon name="tabler:settings" className="size-5" />
        <span className="sr-only">Ajustes da dívida</span>
      </button>
      {open ? (
        <DebtSettingsDialog
          autoPay={autoPay}
          canManageVisibility={canManageVisibility}
          currentUserId={currentUserId}
          debtId={debtId}
          debtName={debtName}
          hideMode={hideMode}
          hiddenUserIds={hiddenUserIds}
          kind={kind}
          members={members}
          recurringPaused={recurringPaused}
          remindersEnabled={remindersEnabled}
          shared={shared}
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function DebtSettingsDialog({
  workspaceId,
  debtId,
  debtName,
  autoPay,
  remindersEnabled,
  kind,
  recurringPaused,
  hideMode,
  hiddenUserIds,
  canManageVisibility,
  shared,
  currentUserId,
  members,
  onClose,
}: {
  workspaceId: string;
  debtId: string;
  debtName: string;
  autoPay: boolean;
  remindersEnabled: boolean;
  kind: DebtKind;
  recurringPaused: boolean;
  hideMode: DebtHideMode;
  hiddenUserIds: string[];
  canManageVisibility: boolean;
  shared: boolean;
  currentUserId?: string;
  members: MemberOption[];
  onClose: () => void;
}) {
  const [name, setName] = useState(debtName);
  const [payAuto, setPayAuto] = useState(autoPay);
  const [reminders, setReminders] = useState(remindersEnabled);
  const [paused, setPaused] = useState(recurringPaused);
  const [mode, setMode] = useState<DebtHideMode>(hideMode);
  const [selected, setSelected] = useState<string[]>(hiddenUserIds);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [togglePending, setTogglePending] = useState(false);
  const [hidePending, setHidePending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = pending || togglePending || hidePending || deleting || confirm;
  useDialogMotion(onClose, busy);

  const otherMembers = members.filter((item) => item.userId !== currentUserId);

  async function saveVisibility(nextMode: DebtHideMode, nextSelected: string[]) {
    setHidePending(true);
    setError(null);
    const formData = new FormData();
    formData.set("hideMode", nextMode);
    for (const userId of nextSelected) {
      formData.append("hiddenUserId", userId);
    }
    const result = await setDebtVisibilityAction(workspaceId, debtId, formData);
    setHidePending(false);
    if (result.error) {
      setMode(hideMode);
      setSelected(hiddenUserIds);
      setError(result.error);
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={() => {
            if (!busy) {
              onClose();
            }
          }}
        />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 flex h-[min(40rem,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
          role="dialog"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <p className="text-sm text-ink/50">Dívida</p>
              <h2 className="font-display text-3xl">Ajustes</h2>
            </div>
            <button
              className="rounded-full p-2 text-ink/50 hover:bg-white hover:text-ink"
              onClick={onClose}
              type="button"
            >
              <AppIcon name="tabler:x" className="size-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          <HiddenScroll className="px-5 py-5 sm:px-6">
            <form
              action={async (formData) => {
                setPending(true);
                setError(null);
                setSaved(false);
                const result = await renameDebtAction(workspaceId, debtId, formData);
                setPending(false);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setSaved(true);
              }}
              className="space-y-3"
            >
              <label className="block space-y-1.5">
                <span className="text-sm text-ink/70">Nome</span>
                <input
                  className="field"
                  minLength={2}
                  name="name"
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Cartão, financiamento, loja"
                  required
                  value={name}
                />
              </label>
              {error ? <FormError message={error} /> : null}
              {saved ? <p className="text-sm text-moss">Nome salvo.</p> : null}
              <button className="btn-primary w-full" disabled={pending} type="submit">
                {pending ? "Salvando..." : "Salvar nome"}
              </button>
            </form>

            <div className="mt-6 space-y-3 border-t border-line pt-5">
              <ToggleRow
                checked={payAuto}
                disabled={togglePending}
                label="Baixa automática"
                tip="Empréstimo ou débito. Mensal: parcela do cron já nasce paga. Parcelada: baixa no vencimento."
                onChange={(next) => {
                  setPayAuto(next);
                  setTogglePending(true);
                  setError(null);
                  const formData = new FormData();
                  formData.set("autoPay", next ? "1" : "0");
                  void setDebtAutoPayAction(workspaceId, debtId, formData).then((result) => {
                    setTogglePending(false);
                    if (result.error) {
                      setPayAuto(!next);
                      setError(result.error);
                    }
                  });
                }}
              />
              <ToggleRow
                checked={reminders}
                disabled={togglePending}
                label="Avisar por e-mail"
                tip="Avisa antes do vencimento e se atrasar. O admin precisa ter o cron de e-mail ligado."
                onChange={(next) => {
                  setReminders(next);
                  setTogglePending(true);
                  setError(null);
                  const formData = new FormData();
                  formData.set("remindersEnabled", next ? "1" : "0");
                  void setDebtRemindersAction(workspaceId, debtId, formData).then((result) => {
                    setTogglePending(false);
                    if (result.error) {
                      setReminders(!next);
                      setError(result.error);
                    }
                  });
                }}
              />
              {kind === "RECURRING" || kind === "VARIABLE" ? (
                <ToggleRow
                  checked={paused}
                  disabled={togglePending}
                  label={kind === "VARIABLE" ? "Pausar mensal variável" : "Pausar recorrência"}
                  tip="Para de gerar a cobrança do mês até você despausar."
                  onChange={(next) => {
                    setPaused(next);
                    setTogglePending(true);
                    setError(null);
                    const formData = new FormData();
                    formData.set("paused", next ? "1" : "0");
                    void setDebtRecurringPausedAction(workspaceId, debtId, formData).then(
                      (result) => {
                        setTogglePending(false);
                        if (result.error) {
                          setPaused(!next);
                          setError(result.error);
                        }
                      },
                    );
                  }}
                />
              ) : null}
            </div>

            {canManageVisibility && shared ? (
              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <div>
                  <p className="text-sm font-medium text-ink">
                    <LabelWithTip
                      label="Ocultar no workspace"
                      tip="Para quem estiver oculto, a dívida some da lista e do índice. Admin continua vendo."
                    />
                  </p>
                </div>

                <div className="grid gap-2">
                  {(
                    [
                      { value: "NONE", label: "Visível para todos", hint: "Padrão do workspace" },
                      {
                        value: "ALL",
                        label: "Oculta para o restante",
                        hint: "Só administradores veem",
                      },
                      {
                        value: "SELECTED",
                        label: "Oculta para pessoas",
                        hint: "Escolha quem não vê",
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3"
                      key={option.value}
                    >
                      <input
                        checked={mode === option.value}
                        className="mt-1 size-4 accent-[var(--pine)]"
                        disabled={hidePending}
                        name="hideMode"
                        onChange={() => {
                          setMode(option.value);
                          void saveVisibility(option.value, selected);
                        }}
                        type="radio"
                        value={option.value}
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-ink/55">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {mode === "SELECTED" ? (
                  <div className="space-y-2 rounded-2xl border border-line bg-paper/50 px-3 py-3">
                    {otherMembers.length === 0 ? (
                      <p className="text-xs text-ink/55">Não há outras pessoas neste workspace.</p>
                    ) : (
                      otherMembers.map((member) => {
                        const checked = selected.includes(member.userId);
                        return (
                          <label
                            className="flex cursor-pointer items-center gap-3 py-1"
                            key={member.userId}
                          >
                            <input
                              checked={checked}
                              className="size-4 accent-[var(--pine)]"
                              disabled={hidePending}
                              onChange={() => {
                                const next = checked
                                  ? selected.filter((id) => id !== member.userId)
                                  : [...selected, member.userId];
                                setSelected(next);
                                void saveVisibility("SELECTED", next);
                              }}
                              type="checkbox"
                            />
                            <span className="text-sm text-ink">{member.userName}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 space-y-3 border-t border-line pt-5">
              <p className="text-sm text-ink/60">
                Apagar tira a dívida, as parcelas, as notas e os comprovantes. Isso não volta.
              </p>
              <button className="btn-ghost w-full text-clay" onClick={() => setConfirm(true)} type="button">
                <AppIcon name="tabler:trash" className="size-4" />
                Apagar dívida
              </button>
            </div>
          </HiddenScroll>
        </section>
      </div>

      <ConfirmDialog
        confirmLabel="Apagar"
        danger
        description={`${name} some com as parcelas, notas e comprovantes. Não tem como desfazer.`}
        open={confirm}
        pending={deleting}
        title={`Apagar ${name}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setDeleting(true);
          void deleteDebtAction(workspaceId, debtId).then((result) => {
            if (result.error) {
              setDeleting(false);
              setConfirm(false);
              setError(result.error);
            }
          });
        }}
      />
    </Portal>
  );
}

function ToggleRow({
  checked,
  label,
  tip,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  tip: string;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
      <input
        checked={checked}
        className="mt-1 size-4 accent-[var(--pine)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="pt-0.5 text-sm font-medium text-ink">
        <LabelWithTip label={label} tip={tip} />
      </span>
    </label>
  );
}
