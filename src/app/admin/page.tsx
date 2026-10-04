import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";
import { Reveal } from "@/components/motion/reveal";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";

export default async function AdminOverviewPage() {
  await requireSystemAdmin();
  const overview = await getRepositories().admin.overview();

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <p className="text-xs uppercase tracking-wide text-ink/45">Painel</p>
        <h2 className="font-display text-3xl sm:text-4xl">Visão geral</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Contas, espaços e envio de e-mail da plataforma, num lugar só.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/admin/usuarios"
          icon="tabler:users"
          label="Usuários"
          value={String(overview.users.total)}
          hint={`${overview.users.active} ativos · ${overview.users.admins} admin`}
        />
        <StatCard
          href="/admin/espacos"
          icon="tabler:building-community"
          label="Espaços"
          value={String(overview.workspaces.active)}
          hint={`${overview.workspaces.personal} pessoais · ${overview.workspaces.shared} compartilhados`}
        />
        <StatCard
          href="/admin/espacos"
          icon="tabler:list"
          label="Dívidas"
          value={String(overview.debts.total)}
          hint="Em todos os espaços"
        />
        <StatCard
          href="/admin/configuracoes/fila"
          icon="tabler:mail"
          label="Fila de e-mail"
          value={String(overview.mail.pending)}
          hint={
            overview.mail.failed > 0
              ? `${overview.mail.failed} falhou · ${overview.mail.sent} enviados`
              : `${overview.mail.sent} enviados`
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2" data-reveal>
        <QuickCard
          href="/admin/usuarios"
          icon="tabler:user-cog"
          title="Usuários"
          text="Papel User ou Admin, desativar conta e trocar senha."
        />
        <QuickCard
          href="/admin/espacos"
          icon="tabler:folders"
          title="Espaços"
          text="Todos os workspaces criados, com dono, tipo e status."
        />
        <QuickCard
          href="/admin/configuracoes"
          icon="tabler:settings"
          title="Configurações"
          text="SMTP, modelos de e-mail e fila de envio."
        />
        <QuickCard
          href="/admin/configuracoes/smtp"
          icon="tabler:server"
          title="SMTP"
          text={
            overview.mail.providers === 0
              ? "Nenhum provedor ainda. Entra e configura o envio."
              : `${overview.mail.providers} provedor${overview.mail.providers === 1 ? "" : "es"} cadastrado${overview.mail.providers === 1 ? "" : "s"}.`
          }
        />
      </div>
    </Reveal>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link className="sheet block" data-reveal href={href}>
      <div className="flex items-center gap-2 text-ink/55">
        <AppIcon name={icon} className="size-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
      <p className="mt-2 text-sm text-ink/50">{hint}</p>
    </Link>
  );
}

function QuickCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <Link className="sheet flex items-start gap-3" href={href}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pine-soft text-pine-dark">
        <AppIcon name={icon} className="size-5" />
      </span>
      <span>
        <span className="font-display text-2xl">{title}</span>
        <span className="mt-1 block text-sm text-ink/60">{text}</span>
      </span>
    </Link>
  );
}
