import { fail, ok, type Result } from "@/shared/types/result";
import type { FileStorage, StoredFile } from "@/shared/storage/file-storage";
import type { AdminRepository } from "../domain/admin-repository";
import type { SystemSettings } from "../domain/platform";

const LOGO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const FAVICON_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadBrandLogo(
  file: StoredFile | null,
  admin: AdminRepository,
  storage: FileStorage,
): Promise<Result<SystemSettings>> {
  const validated = validateImage(file, LOGO_MIME, "Use JPG, PNG ou WebP na logo");
  if (!validated.ok) {
    return validated;
  }

  const current = await admin.getSystemSettings();
  if (current.brandLogoUrl) {
    await storage.remove(current.brandLogoUrl);
  }

  const brandLogoUrl = await storage.save(validated.value, "brand");
  return ok(await admin.setBrandAssets({ brandLogoUrl }));
}

export async function uploadBrandFavicon(
  file: StoredFile | null,
  admin: AdminRepository,
  storage: FileStorage,
): Promise<Result<SystemSettings>> {
  const validated = validateImage(file, FAVICON_MIME, "Use PNG, WebP ou ICO no favicon");
  if (!validated.ok) {
    return validated;
  }

  const current = await admin.getSystemSettings();
  if (current.brandFaviconUrl) {
    await storage.remove(current.brandFaviconUrl);
  }

  const brandFaviconUrl = await storage.save(validated.value, "brand");
  return ok(await admin.setBrandAssets({ brandFaviconUrl }));
}

export async function clearBrandLogo(
  admin: AdminRepository,
  storage: FileStorage,
): Promise<Result<SystemSettings>> {
  const current = await admin.getSystemSettings();
  if (current.brandLogoUrl) {
    await storage.remove(current.brandLogoUrl);
  }
  return ok(await admin.setBrandAssets({ brandLogoUrl: null }));
}

export async function clearBrandFavicon(
  admin: AdminRepository,
  storage: FileStorage,
): Promise<Result<SystemSettings>> {
  const current = await admin.getSystemSettings();
  if (current.brandFaviconUrl) {
    await storage.remove(current.brandFaviconUrl);
  }
  return ok(await admin.setBrandAssets({ brandFaviconUrl: null }));
}

function validateImage(
  file: StoredFile | null,
  allowed: readonly string[],
  invalidMessage: string,
): Result<StoredFile> {
  if (!file) {
    return fail("INVALID_FILE", "Escolha um arquivo");
  }
  if (!allowed.includes(file.mimeType)) {
    return fail("INVALID_FILE", invalidMessage);
  }
  if (file.buffer.byteLength > MAX_BYTES) {
    return fail("FILE_TOO_LARGE", "Arquivo pode ter no maximo 2 MB");
  }
  return ok(file);
}
