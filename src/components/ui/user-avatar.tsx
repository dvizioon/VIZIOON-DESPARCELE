"use client";

import Avatar from "boring-avatars";
import { avatarRenderSeed, type AvatarVariant } from "@/modules/auth/domain/user";

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
  avatarSeed,
  variant = "beam",
  size = 36,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  variant?: AvatarVariant | string;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        className={`block shrink-0 rounded-full object-cover ${className}`}
        height={size}
        src={avatarUrl}
        style={{ width: size, height: size }}
        width={size}
      />
    );
  }

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full leading-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Avatar
        colors={DESPARCELE_AVATAR_COLORS}
        name={avatarRenderSeed({ name, avatarSeed })}
        size={size}
        variant={(variant as AvatarVariant) || "beam"}
      />
    </span>
  );
}
