import { BrandSettingsForm } from "@/components/admin/brand-settings-form";
import { Reveal } from "@/components/motion/reveal";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { SettingsBack } from "../_settings-back";

export default async function AdminBrandSettingsPage() {
  await requireSystemAdmin();
  const settings = await getRepositories().admin.getSystemSettings();

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <SettingsBack />
        <h2 className="font-display text-3xl sm:text-4xl">Marca</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Logo dos e-mails e favicon do navegador. Os arquivos saem por URL pública mascarada.
        </p>
      </div>
      <div data-reveal>
        <BrandSettingsForm
          hasCustomFavicon={Boolean(settings.brandFaviconUrl)}
          hasCustomLogo={Boolean(settings.brandLogoUrl)}
        />
      </div>
    </Reveal>
  );
}
