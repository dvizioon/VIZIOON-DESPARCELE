"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PillTrack } from "@/components/motion/pill-track";
import { AppIcon } from "@/components/ui/icon";

type NavItem = {
  href: string;
  icon: string;
  label: string;
};

export function WorkspaceNav({
  items,
  extra,
}: {
  items: NavItem[];
  extra?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav className="mb-5 sm:mb-6">
      <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 sm:overflow-visible">
        <PillTrack className="flex min-w-max gap-1 rounded-full bg-white/80 p-1" watch={pathname}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              className={`nav-link relative z-10 ${active ? "text-ink" : ""}`}
              data-pill-active={active ? "true" : "false"}
              href={item.href}
              key={item.href}
            >
              <AppIcon name={item.icon} className="size-4" />
              {item.label}
            </Link>
          );
        })}
        {extra ? <div className="relative z-10 rounded-full hover:bg-white">{extra}</div> : null}
      </PillTrack>
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (href.endsWith("/debts") && pathname.includes("/debts") && !pathname.endsWith("/new")) {
    return pathname.includes("/debts");
  }

  return false;
}
