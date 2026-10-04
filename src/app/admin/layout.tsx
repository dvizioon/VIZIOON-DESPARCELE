import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { PageMotion } from "@/components/motion/page-motion";
import { requireSystemAdmin } from "@/shared/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSystemAdmin();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-0 lg:h-screen">
        <AdminSidebar adminName={admin.name} />
      </div>
      <PageMotion className="min-w-0">
        <header
          className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 lg:hidden"
          data-page
        >
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="size-10 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/45">Desparcele</p>
              <h1 className="font-display text-2xl leading-none">Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="btn-ghost" href="/workspaces">
              Espaços
            </Link>
            <SignOutButton />
          </div>
        </header>
        <AdminMobileNav />
        <div className="px-4 py-5 sm:px-6 sm:py-8">{children}</div>
      </PageMotion>
    </div>
  );
}
