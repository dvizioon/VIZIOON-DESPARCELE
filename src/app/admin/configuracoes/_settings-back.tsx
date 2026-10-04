import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";

export function SettingsBack() {
  return (
    <Link className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink" href="/admin/configuracoes">
      <AppIcon name="tabler:chevron-left" className="size-4" />
      Configurações
    </Link>
  );
}
