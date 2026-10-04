import { AdminMailConsole } from "@/components/admin/admin-mail-console";
import { Reveal } from "@/components/motion/reveal";
import { getAdminMailView } from "@/modules/mail/application/get-admin-mail-view";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { SettingsBack } from "../_settings-back";

export default async function AdminSmtpPage() {
  await requireSystemAdmin();
  const view = await getAdminMailView(getRepositories().mail);

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <SettingsBack />
        <h2 className="font-display text-3xl sm:text-4xl">SMTP</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Host, porta, remetente e teste de envio. Esse é o provedor que dispara os e-mails da plataforma.
        </p>
      </div>
      <div data-reveal>
        <AdminMailConsole only="smtp" {...view} />
      </div>
    </Reveal>
  );
}
