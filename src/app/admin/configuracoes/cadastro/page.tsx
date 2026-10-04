import { SignupSettingsForm } from "@/components/admin/signup-settings-form";
import { Reveal } from "@/components/motion/reveal";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { SettingsBack } from "../_settings-back";

export default async function AdminSignupSettingsPage() {
  await requireSystemAdmin();
  const settings = await getRepositories().admin.getSystemSettings();

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <SettingsBack />
        <h2 className="font-display text-3xl sm:text-4xl">Cadastro</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Decide se o sistema aceita criação de conta pela tela pública ou só entrada de quem já tem
          usuário.
        </p>
      </div>
      <div data-reveal>
        <SignupSettingsForm allowPublicSignup={settings.allowPublicSignup} />
      </div>
    </Reveal>
  );
}
