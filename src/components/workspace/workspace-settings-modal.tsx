"use client";

import { useRef, useState } from "react";
import { getWorkspaceInsightsAction, renameWorkspaceAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { InviteForm } from "@/components/forms/invite-form";
import { useDialogMotion } from "@/components/motion/use-dialog-motion";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";
import { ArchiveWorkspaceButton } from "@/components/workspace/archive-workspace-button";
import { DeleteWorkspaceButton } from "@/components/workspace/delete-workspace-button";
import { MemberRoleForm } from "@/components/workspace/member-role-form";
import { RemoveMemberButton } from "@/components/workspace/remove-member-button";
import { WorkspaceInsightsPanel } from "@/components/workspace/workspace-insights-panel";
import type { WorkspaceInsights } from "@/modules/workspace/domain/workspace-insights";
import type { WorkspaceRole } from "@/modules/workspace/domain/workspace";

type SettingsMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: WorkspaceRole;
};

type SettingsTab = "overview" | "people" | "settings";

export function WorkspaceSettingsModal({
  workspaceId,
  workspaceName,
  shared,
  ownerId,
  members,
  archived,
}: {
  workspaceId: string;
  workspaceName: string;
  shared: boolean;
  ownerId: string;
  members: SettingsMember[];
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<WorkspaceInsights | null>(null);
  const loadingRef = useRef(false);

  function loadInsights() {
    if (insights || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    void getWorkspaceInsightsAction(workspaceId).then((result) => {
      if (result.ok) {
        setInsights(result.insights);
      }
      loadingRef.current = false;
    });
  }

  return (
    <>
      <button
        className="rounded-full p-2 text-ink/50 transition hover:bg-white hover:text-ink"
        onClick={() => {
          loadInsights();
          setOpen(true);
        }}
        onPointerEnter={loadInsights}
        type="button"
      >
        <AppIcon name="tabler:settings" className="size-5" />
        <span className="sr-only">Ajustes do espaço</span>
      </button>
      {open ? (
        <SettingsDialog
          archived={archived}
          insights={insights}
          members={members}
          ownerId={ownerId}
          shared={shared}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function SettingsDialog({
  workspaceId,
  workspaceName,
  shared,
  ownerId,
  members,
  insights,
  archived,
  onClose,
}: {
  workspaceId: string;
  workspaceName: string;
  shared: boolean;
  ownerId: string;
  members: SettingsMember[];
  insights: WorkspaceInsights | null;
  archived: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(workspaceName);

  useDialogMotion(onClose, pending);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={onClose}
        />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 flex h-[min(40rem,92vh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
          role="dialog"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <p className="text-sm text-ink/50">Administração</p>
              <h2 className="font-display text-3xl">Ajustes do espaço</h2>
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

          <div className="mx-5 grid shrink-0 grid-cols-3 gap-1 rounded-full bg-paper p-1 sm:mx-6">
            <SettingsTabButton
              active={tab === "overview"}
              icon="tabler:chart-dots-2"
              label="Visão geral"
              onClick={() => setTab("overview")}
            />
            <SettingsTabButton
              active={tab === "people"}
              icon="tabler:users"
              label="Pessoas"
              onClick={() => setTab("people")}
            />
            <SettingsTabButton
              active={tab === "settings"}
              icon="tabler:adjustments"
              label="Ajustes"
              onClick={() => setTab("settings")}
            />
          </div>

          <HiddenScroll className="px-5 py-5 sm:px-6" key={tab}>
            {tab === "overview" ? (
              insights ? (
                <WorkspaceInsightsPanel insights={insights} shared={shared} />
              ) : (
                <OverviewSkeleton />
              )
            ) : null}

            {tab === "people" ? (
              shared ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-2xl">Pessoas</h3>
                    <p className="mt-1 text-sm text-ink/55">
                      {members.length} no espaço. Convide e ajuste o acesso.
                    </p>
                  </div>
                  <ul className="grid gap-3">
                    {members.map((item) => (
                      <li
                        className="flex flex-col gap-3 rounded-2xl bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                        key={item.userId}
                      >
                        <div>
                          <p className="font-medium">{item.userName}</p>
                          <p className="text-sm text-ink/55">{item.userEmail}</p>
                        </div>
                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-stretch">
                          <MemberRoleForm
                            locked={item.userId === ownerId}
                            role={item.role}
                            userId={item.userId}
                            workspaceId={workspaceId}
                          />
                          {item.userId === ownerId ? null : (
                            <RemoveMemberButton
                              userId={item.userId}
                              userName={item.userName}
                              workspaceId={workspaceId}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <InviteForm workspaceId={workspaceId} />
                </div>
              ) : (
                <p className="text-sm text-ink/55">Espaço pessoal. Só você usa daqui.</p>
              )
            ) : null}

            {tab === "settings" ? (
              <div className="space-y-6">
                <form
                  action={async (formData) => {
                    setPending(true);
                    setError(null);
                    const result = await renameWorkspaceAction(workspaceId, formData);
                    setPending(false);
                    if (result.error) {
                      setError(result.error);
                    }
                  }}
                  className="space-y-3"
                >
                  <label className="block space-y-1.5">
                    <span className="text-sm text-ink/70">Nome</span>
                    <input
                      className="field"
                      minLength={2}
                      name="name"
                      onChange={(event) => setName(event.target.value)}
                      required
                      value={name}
                    />
                  </label>
                  {error ? <FormError message={error} /> : null}
                  <button className="btn-primary w-full" disabled={pending} type="submit">
                    {pending ? "Salvando..." : "Salvar nome"}
                  </button>
                </form>

                <div className="space-y-3 border-t border-line pt-4">
                  <p className="text-sm text-ink/55">
                    Arquivar tira de Todos. A lixeira guarda o espaço até restaurar ou apagar de vez.
                  </p>
                  <ArchiveWorkspaceButton
                    archived={archived}
                    wide
                    workspaceId={workspaceId}
                    workspaceName={name}
                  />
                  <DeleteWorkspaceButton
                    className="btn-ghost w-full text-clay"
                    workspaceId={workspaceId}
                    workspaceName={name}
                  />
                </div>
              </div>
            ) : null}
          </HiddenScroll>
        </section>
      </div>
    </Portal>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-3xl bg-paper" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="h-20 animate-pulse rounded-2xl bg-paper" key={index} />
        ))}
      </div>
    </div>
  );
}

function SettingsTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-11 min-w-0 w-full items-center justify-center gap-1 rounded-full px-1 text-xs font-medium transition sm:gap-1.5 sm:px-2 sm:text-sm ${
        active ? "bg-white text-ink shadow-sm" : "text-ink/55 hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      <AppIcon name={icon} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
