"use client";

import { Icon as IconifyIcon } from "@iconify/react";

type AppIconProps = {
  name: string;
  className?: string;
};

export function AppIcon({ name, className }: AppIconProps) {
  return <IconifyIcon icon={name} className={className} aria-hidden />;
}
