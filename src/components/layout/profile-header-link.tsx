"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";

export function ProfileHeaderLink({
  name,
  avatarUrl,
  avatarVariant = "beam",
  showName = true,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarVariant?: string;
  showName?: boolean;
}) {
  return (
    <Link
      className="inline-flex max-w-[12rem] items-center gap-2 rounded-full px-1.5 py-1 transition hover:bg-white"
      href="/perfil"
      title="Meu perfil"
    >
      <UserAvatar avatarUrl={avatarUrl} name={name} size={32} variant={avatarVariant} />
      {showName ? (
        <span className="hidden truncate text-sm text-ink/55 md:inline">{name}</span>
      ) : null}
    </Link>
  );
}
