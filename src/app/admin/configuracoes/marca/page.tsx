import { BrandSettingsForm } from "@/components/admin/brand-settings-form";
import { Reveal } from "@/components/motion/reveal";
import { LabelWithTip } from "@/components/ui/tip";
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
        <h2 className="font-display text-3xl sm:text-4xl">
          <LabelWithTip
            label="Marca"
            tip="Logo dos e-mails e favicon do navegador. Os arquivos saem por URL pública mascarada."
          />
        </h2>
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
