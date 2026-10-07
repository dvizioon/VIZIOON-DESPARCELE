"use client";

import { useEffect, useRef, useState } from "react";
import {
  setAvatarVariantAction,
  uploadAvatarAction,
} from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";
import { DESPARCELE_AVATAR_COLORS, UserAvatar } from "@/components/ui/user-avatar";
import {
  AVATAR_VARIANTS,
  newAvatarSeed,
  type AvatarVariant,
} from "@/modules/auth/domain/user";
import Avatar from "boring-avatars";

const VARIANT_LABEL: Record<AvatarVariant, string> = {
  beam: "Raio",
  marble: "Mármore",
  pixel: "Pixel",
  sunset: "Pôr do sol",
  ring: "Anéis",
  bauhaus: "Bauhaus",
};

export function AvatarPickerModal({
  open,
  name,
  avatarUrl,
  avatarSeed,
  variant,
  onClose,
  onSaved,
}: {
  open: boolean;
  name: string;
  avatarUrl: string | null;
  avatarSeed: string | null;
  variant: AvatarVariant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftVariant, setDraftVariant] = useState<AvatarVariant>(variant);
  const [draftSeed, setDraftSeed] = useState<string | null>(avatarSeed);
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"variant" | "photo">(avatarUrl ? "photo" : "variant");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftVariant(variant);
    setDraftSeed(avatarSeed);
    setDraftPhoto(null);
    setDraftPreview(null);
    setMode(avatarUrl ? "photo" : "variant");
    setError(null);
    setPending(false);
  }, [open, variant, avatarUrl, avatarSeed]);

  useEffect(() => {
    return () => {
      if (draftPreview) {
        URL.revokeObjectURL(draftPreview);
      }
    };
  }, [draftPreview]);

  if (!open) {
    return null;
  }

  function pickPhoto(file: File | null) {
    if (draftPreview) {
      URL.revokeObjectURL(draftPreview);
    }
    if (!file) {
      setDraftPhoto(null);
      setDraftPreview(null);
      return;
    }
    setDraftPhoto(file);
    setDraftPreview(URL.createObjectURL(file));
    setMode("photo");
  }

  function randomize() {
    setMode("variant");
    pickPhoto(null);
    setDraftSeed(newAvatarSeed());
  }

  async function save() {
    setPending(true);
    setError(null);

    if (mode === "photo" && draftPhoto) {
      const formData = new FormData();
      formData.set("avatar", draftPhoto);
      const result = await uploadAvatarAction(null, formData);
      setPending(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
      return;
    }

    if (mode === "photo" && avatarUrl && !draftPhoto) {
      setPending(false);
      onClose();
      return;
    }

    const formData = new FormData();
    formData.set("variant", draftVariant);
    formData.set("seed", draftSeed ?? "");
    const result = await setAvatarVariantAction(null, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
    onClose();
  }

  const previewUrl = mode === "photo" ? (draftPreview ?? avatarUrl) : null;
  const styleSeed = draftSeed || name || "pessoa";

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div className="dialog-overlay absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
          role="dialog"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-2xl">Avatar</p>
              <p className="text-sm text-ink/55">Escolha um estilo, gere outro ou envie uma foto.</p>
            </div>
            <button
              aria-label="Fechar"
              className="rounded-full p-2 text-ink/50 hover:bg-paper hover:text-ink"
              onClick={onClose}
              type="button"
            >
              <AppIcon className="size-5" name="tabler:x" />
            </button>
          </header>

          <div className="space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex justify-center">
              <UserAvatar
                avatarSeed={draftSeed}
                avatarUrl={previewUrl}
                name={name}
                size={96}
                variant={draftVariant}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink/70">Estilos</p>
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:text-pine-dark"
                  onClick={randomize}
                  type="button"
                >
                  <AppIcon className="size-4" name="tabler:dice" />
                  Gerar aleatório
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {AVATAR_VARIANTS.map((item) => {
                  const active = mode === "variant" && draftVariant === item && !previewUrl;
                  return (
                    <button
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition ${
                        active
                          ? "border-pine bg-pine-soft/60"
                          : "border-line bg-paper/60 hover:border-pine/40"
                      }`}
                      key={item}
                      onClick={() => {
                        setMode("variant");
                        setDraftVariant(item);
                        pickPhoto(null);
                      }}
                      type="button"
                    >
                      <span className="relative block size-11 overflow-hidden rounded-full leading-none">
                        <Avatar
                          colors={DESPARCELE_AVATAR_COLORS}
                          name={styleSeed}
                          size={44}
                          variant={item}
                        />
                      </span>
                      <span className="text-[10px] text-ink/55">{VARIANT_LABEL[item]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink/70">Foto</p>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  pickPhoto(event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
                ref={fileRef}
                type="file"
              />
              <button
                className="btn-ghost inline-flex w-full items-center justify-center gap-2"
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <AppIcon className="size-4" name="tabler:camera" />
                {draftPhoto ? "Trocar foto" : "Escolher foto"}
              </button>
              {draftPhoto ? (
                <p className="mt-1 text-center text-xs text-ink/45">{draftPhoto.name}</p>
              ) : null}
            </div>

            {error ? <FormError message={error} /> : null}
          </div>

          <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
            <button className="btn-ghost" disabled={pending} onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="btn-primary" disabled={pending} onClick={() => void save()} type="button">
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </footer>
        </section>
      </div>
    </Portal>
  );
}
