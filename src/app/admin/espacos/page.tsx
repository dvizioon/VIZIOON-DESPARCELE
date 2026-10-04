import Link from "next/link";
import { FilterPills } from "@/components/motion/filter-pills";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import { workspaceListBucket, type WorkspaceListView } from "@/modules/workspace/domain/workspace";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { formatDateFull } from "@/shared/utils/date";

type AdminWorkspacesPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function AdminWorkspacesPage({ searchParams }: AdminWorkspacesPageProps) {
  await requireSystemAdmin();
  const { view: rawView } = await searchParams;
  const view = parseView(rawView);
  const workspaces = await getRepositories().admin.listWorkspaces();
  const counts = {
    todos: workspaces.filter((item) => workspaceListBucket(item) === "todos").length,
    arquivados: workspaces.filter((item) => workspaceListBucket(item) === "arquivados").length,
    lixeira: workspaces.filter((item) => workspaceListBucket(item) === "lixeira").length,
  };
  const current = workspaces.filter((item) => workspaceListBucket(item) === view);

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <p className="text-xs uppercase tracking-wide text-ink/45">Plataforma</p>
        <h2 className="font-display text-3xl sm:text-4xl">Espaços</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Todos os workspaces criados pelos usuários, com dono e situação.
        </p>
      </div>

      <div data-reveal>
        <FilterPills watch={`admin-spaces-${view}`}>
          <FilterLink active={view === "todos"} href="/admin/espacos?view=todos">
            Ativos {counts.todos}
          </FilterLink>
          <FilterLink active={view === "arquivados"} href="/admin/espacos?view=arquivados">
            Arquivados {counts.arquivados}
          </FilterLink>
          <FilterLink active={view === "lixeira"} href="/admin/espacos?view=lixeira">
            Lixeira {counts.lixeira}
          </FilterLink>
        </FilterPills>
      </div>

      {current.length === 0 ? (
        <div className="sheet flex items-center gap-3 text-ink/60" data-reveal>
          <AppIcon name="tabler:folder-off" className="size-5" />
          Nenhum espaço neste filtro
        </div>
      ) : (
        <ul className="grid gap-3">
          {current.map((workspace) => (
            <li className="sheet" data-reveal key={workspace.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-2xl">{workspace.name}</p>
                  <p className="mt-1 text-sm text-ink/55">
                    {workspace.ownerName} · {workspace.ownerEmail}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/70 ring-1 ring-line">
                      {workspace.type === "SHARED" ? "Compartilhado" : "Pessoal"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/70 ring-1 ring-line">
                      {workspace.memberCount} pessoa{workspace.memberCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/70 ring-1 ring-line">
                      {workspace.debtCount} dívida{workspace.debtCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/70 ring-1 ring-line">
                      {formatDateFull(workspace.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
}

function parseView(value: string | undefined): WorkspaceListView {
  if (value === "arquivados" || value === "lixeira") {
    return value;
  }

  return "todos";
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      className={`nav-link relative z-10 shrink-0 ${active ? "text-ink" : ""}`}
      data-pill-active={active ? "true" : "false"}
      href={href}
    >
      {children}
    </Link>
  );
}
