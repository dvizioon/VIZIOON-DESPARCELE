"use client";

import { logoutAction } from "@/app/actions/auth";
import { AppIcon } from "@/components/ui/icon";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink/70 transition hover:bg-white hover:text-ink"
        type="submit"
      >
        <AppIcon name="tabler:logout" className="size-4" />
        Sair
      </button>
    </form>
  );
}
