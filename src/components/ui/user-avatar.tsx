"use client";

import Avatar from "boring-avatars";
import type { AvatarVariant } from "@/modules/auth/domain/user";

/** Paleta alinhada ao Desparcele (pine / clay / paper). */
export const DESPARCELE_AVATAR_COLORS = [
  "#0c6b5c",
  "#148576",
  "#c05621",
  "#2d6a4f",
  "#efe6d8",
];

export function UserAvatar({
  name,
  avatarUrl,
  variant = "beam",
  size = 36,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  variant?: AvatarVariant | string;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
        height={size}
        src={avatarUrl}
        style={{ width: size, height: size }}
        width={size}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <Avatar
        colors={DESPARCELE_AVATAR_COLORS}
        name={name || "pessoa"}
        size={size}
        variant={(variant as AvatarVariant) || "beam"}
      />
    </span>
  );
}
