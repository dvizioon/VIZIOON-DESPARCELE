"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/icon";

export function PasswordField({
  name,
  label,
  autoComplete,
  minLength,
  placeholder,
}: {
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-ink/70">{label}</span>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className="field pr-12"
          minLength={minLength}
          name={name}
          placeholder={placeholder}
          required
          type={visible ? "text" : "password"}
        />
        <button
          className="absolute inset-y-0 right-2 my-auto rounded-full p-2 text-ink/45 hover:text-ink"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          <AppIcon name={visible ? "tabler:eye-off" : "tabler:eye"} className="size-5" />
          <span className="sr-only">{visible ? "Esconder senha" : "Mostrar senha"}</span>
        </button>
      </span>
    </label>
  );
}
