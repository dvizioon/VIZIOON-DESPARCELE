import { LoanCronSettings } from "@/components/admin/loan-cron-settings";
import { Reveal } from "@/components/motion/reveal";
import { getLoanCronAdminView } from "@/modules/cron/application/get-loan-cron-admin-view";
import { requireSystemAdmin } from "@/shared/auth/session";
import { SettingsBack } from "../_settings-back";

export default async function AdminLoanCronPage() {
  await requireSystemAdmin();
  const view = await getLoanCronAdminView();

  return (
    <Reveal className="space-y-5">
      <div data-reveal>
        <SettingsBack />
        <h2 className="font-display text-3xl sm:text-4xl">Cron</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Empréstimo: fila diária que marca parcelas vencidas como pagas.
        </p>
      </div>
      <div data-reveal>
        <LoanCronSettings {...view} />
      </div>
    </Reveal>
  );
}
