"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { AppIcon } from "@/components/ui/icon";
import { ADMIN_NAV, isAdminNavActive } from "./admin-nav";

export function AdminSidebar({ adminName }: { adminName: string }) {
  return (
    <aside className="hidden h-full flex-col border-r border-line bg-card/90 lg:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <LogoMark className="size-11" />
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/45">Desparcele</p>
          <p className="font-display text-2xl leading-none">Admin</p>
        </div>
      </div>
      <div className="flex-1 px-4">
        <AdminNavLinks stacked />
      </div>
      <div className="space-y-3 border-t border-line px-4 py-4">
        <p className="truncate text-sm text-ink/55">{adminName}</p>
        <Link className="btn-ghost w-full" href="/workspaces">
          <AppIcon name="tabler:home" className="size-4" />
          Espaços
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  return (
    <div className="border-b border-line bg-card/90 px-3 py-2 lg:hidden">
      <AdminNavLinks />
    </div>
  );
}

function AdminNavLinks({ stacked = false }: { stacked?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={stacked ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto"}>
      {ADMIN_NAV.map((item) => {
        const active = isAdminNavActive(pathname, item.href, "exact" in item ? item.exact : false);

        return (
          <Link
            className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition ${
              active ? "bg-pine-soft font-medium text-pine-dark" : "text-ink/70 hover:bg-white hover:text-ink"
            }`}
            href={item.href}
            key={item.href}
          >
            <AppIcon name={item.icon} className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
