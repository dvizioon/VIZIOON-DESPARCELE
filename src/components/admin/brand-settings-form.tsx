"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  clearBrandFaviconAction,
  clearBrandLogoAction,
  uploadBrandFaviconAction,
  uploadBrandLogoAction,
} from "@/app/actions/admin";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { LabelWithTip } from "@/components/ui/tip";

export function BrandSettingsForm({
  hasCustomLogo,
  hasCustomFavicon,
}: {
  hasCustomLogo: boolean;
  hasCustomFavicon: boolean;
}) {
  const router = useRouter();
  const logoInput = useRef<HTMLInputElement>(null);
  const faviconInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [logoKey, setLogoKey] = useState(0);
  const [faviconKey, setFaviconKey] = useState(0);

  function upload(
    kind: "logo" | "favicon",
    file: File | undefined,
    action: (formData: FormData) => Promise<{ error: string | null; ok?: boolean; message?: string }>,
  ) {
    if (!file) {
      return;
    }
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Salvo.");
      if (kind === "logo") {
        setLogoKey((value) => value + 1);
      } else {
        setFaviconKey((value) => value + 1);
      }
      router.refresh();
    });
  }

  function clear(
    kind: "logo" | "favicon",
    action: () => Promise<{ error: string | null; ok?: boolean; message?: string }>,
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Removido.");
      if (kind === "logo") {
        setLogoKey((value) => value + 1);
      } else {
        setFaviconKey((value) => value + 1);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <AssetCard
        bust={logoKey}
        hasCustom={hasCustomLogo}
        imageSrc={`/api/brand/logo?v=${logoKey}`}
        label="Logo"
        tip="Aparece nos e-mails. URL pública: /api/brand/logo"
        onClear={() => clear("logo", clearBrandLogoAction)}
        onPick={() => logoInput.current?.click()}
        pending={pending}
        previewClassName="size-16 rounded-2xl"
      >
        <input
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            upload("logo", event.target.files?.[0], uploadBrandLogoAction);
            event.target.value = "";
          }}
          ref={logoInput}
          type="file"
        />
      </AssetCard>

      <AssetCard
        bust={faviconKey}
        hasCustom={hasCustomFavicon}
        imageSrc={`/api/brand/favicon?v=${faviconKey}`}
        label="Favicon"
        tip="Ícone da aba do navegador. URL pública: /api/brand/favicon"
        onClear={() => clear("favicon", clearBrandFaviconAction)}
        onPick={() => faviconInput.current?.click()}
        pending={pending}
        previewClassName="size-10 rounded-lg"
      >
        <input
          accept="image/png,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico"
          className="hidden"
          onChange={(event) => {
            upload("favicon", event.target.files?.[0], uploadBrandFaviconAction);
            event.target.value = "";
          }}
          ref={faviconInput}
          type="file"
        />
      </AssetCard>

      {error ? <FormError message={error} /> : null}
      {message ? <p className="text-sm text-moss">{message}</p> : null}
    </div>
  );
}

function AssetCard({
  label,
  tip,
  imageSrc,
  previewClassName,
  hasCustom,
  pending,
  onPick,
  onClear,
  children,
}: {
  label: string;
  tip: string;
  imageSrc: string;
  previewClassName: string;
  hasCustom: boolean;
  pending: boolean;
  onPick: () => void;
  onClear: () => void;
  children: React.ReactNode;
  bust: number;
}) {
  return (
    <div className="sheet flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={label}
          className={`${previewClassName} border border-ink/10 bg-white object-contain`}
          src={imageSrc}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">
              <LabelWithTip label={label} tip={tip} />
            </h3>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/55">
              {hasCustom ? "Personalizada" : "Padrão"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {children}
        <button className="btn-primary" disabled={pending} onClick={onPick} type="button">
          <AppIcon className="size-4" name="tabler:upload" />
          Enviar
        </button>
        {hasCustom ? (
          <button className="btn-secondary" disabled={pending} onClick={onClear} type="button">
            Usar padrão
          </button>
        ) : null}
      </div>
    </div>
  );
}
