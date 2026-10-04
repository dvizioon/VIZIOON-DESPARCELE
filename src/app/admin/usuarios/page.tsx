import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import { isSeedMasterAdmin, systemRoleLabel } from "@/modules/auth/domain/user";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { formatDateFull } from "@/shared/utils/date";

export default async function AdminUsersPage() {
  const admin = await requireSystemAdmin();
  const users = await getRepositories().admin.listUsers();

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <p className="text-xs uppercase tracking-wide text-ink/45">Contas</p>
        <h2 className="font-display text-3xl sm:text-4xl">Usuários</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Cada conta tem papel User ou Admin. Dá para desativar e trocar a senha daqui.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="sheet flex items-center gap-3 text-ink/60" data-reveal>
          <AppIcon name="tabler:users-off" className="size-5" />
          Nenhum usuário ainda
        </div>
      ) : (
        <ul className="grid gap-3">
          {users.map((user) => {
            const disabled = Boolean(user.disabledAt);

            return (
              <li className="sheet" data-reveal key={user.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-2xl">{user.name}</p>
                      <RoleBadge role={user.systemRole} />
                      {disabled ? <StatusBadge label="Desativado" tone="clay" /> : <StatusBadge label="Ativo" tone="pine" />}
                    </div>
                    <p className="mt-1 text-sm text-ink/55">{user.email}</p>
                    <p className="mt-2 text-xs text-ink/45">
                      {user.ownedWorkspaceCount} espaço{user.ownedWorkspaceCount === 1 ? "" : "s"} criado
                      {user.ownedWorkspaceCount === 1 ? "" : "s"}
                      {" · "}
                      desde {formatDateFull(user.createdAt)}
                    </p>
                  </div>
                  <AdminUserActions
                    disabled={disabled}
                    isMaster={isSeedMasterAdmin(user.email)}
                    isSelf={user.id === admin.id}
                    name={user.name}
                    role={user.systemRole}
                    userId={user.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Reveal>
  );
}

function RoleBadge({ role }: { role: "MEMBER" | "ADMIN" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        role === "ADMIN" ? "bg-pine-soft text-pine-dark" : "bg-white text-ink/70 ring-1 ring-line"
      }`}
    >
      {systemRoleLabel(role)}
    </span>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "pine" | "clay" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        tone === "pine" ? "bg-pine-soft text-pine-dark" : "bg-clay/10 text-clay"
      }`}
    >
      {label}
    </span>
  );
}
