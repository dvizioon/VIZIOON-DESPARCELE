import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";
import { Reveal } from "@/components/motion/reveal";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";

export default async function AdminSettingsPage() {
  await requireSystemAdmin();
  const { admin } = getRepositories();
  const [overview, smtp, settings] = await Promise.all([
    admin.overview(),
    admin.smtpSummary(),
    admin.getSystemSettings(),
  ]);

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <p className="text-xs uppercase tracking-wide text-ink/45">Plataforma</p>
        <h2 className="font-display text-3xl sm:text-4xl">Configurações</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">Cadastro, e-mail e fila de envio.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SettingsCard
          href="/admin/configuracoes/cadastro"
          icon="tabler:user-plus"
          title="Cadastro"
          text={
            settings.allowPublicSignup
              ? "Novas contas permitidas."
              : "Novas contas bloqueadas."
          }
        />
        <SettingsCard
          href="/admin/configuracoes/smtp"
          icon="tabler:server"
          title="SMTP"
          text={
            smtp.count === 0
              ? "Nenhum provedor ainda. Entra para cadastrar host, porta e remetente."
              : smtp.defaultHost
                ? `${smtp.defaultName} · ${smtp.defaultHost}`
                : `${smtp.count} provedor${smtp.count === 1 ? "" : "es"}`
          }
        />
        <SettingsCard
          href="/admin/configuracoes/email"
          icon="tabler:template"
          title="Modelos de e-mail"
          text="Assunto, HTML e finalidade de cada disparo."
        />
        <SettingsCard
          href="/admin/configuracoes/fila"
          icon="tabler:inbox"
          title="Fila de envio"
          text={
            overview.mail.failed > 0
              ? `${overview.mail.pending} na fila · ${overview.mail.failed} falhou`
              : `${overview.mail.pending} na fila · ${overview.mail.sent} enviados`
          }
        />
      </div>
    </Reveal>
  );
}

function SettingsCard({
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
    <Link className="sheet flex items-start gap-3" data-reveal href={href}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-pine-soft text-pine-dark">
        <AppIcon name={icon} className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="font-display text-2xl">{title}</span>
        <span className="mt-1 block text-sm text-ink/60">{text}</span>
      </span>
    </Link>
  );
}
