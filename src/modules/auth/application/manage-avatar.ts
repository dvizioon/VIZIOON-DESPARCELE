import { fail, ok, type Result } from "@/shared/types/result";
import type { FileStorage } from "@/shared/storage/file-storage";
import {
  parseAvatarVariant,
  toPublicUser,
  type AvatarVariant,
  type PublicUser,
} from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 3 * 1024 * 1024;

export async function uploadUserAvatar(
  userId: string,
  file: { buffer: Buffer; filename: string; mimeType: string } | null,
  users: UserRepository,
  storage: FileStorage,
): Promise<Result<PublicUser>> {
  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  if (!file) {
    return fail("INVALID_FILE", "Escolha uma foto");
  }

  if (!(AVATAR_MIME as readonly string[]).includes(file.mimeType)) {
    return fail("INVALID_FILE", "Use JPG, PNG ou WebP");
  }

  if (file.buffer.byteLength > MAX_BYTES) {
    return fail("FILE_TOO_LARGE", "A foto pode ter no maximo 3 MB");
  }

  if (user.avatarUrl) {
    await storage.remove(user.avatarUrl);
  }

  const avatarUrl = await storage.save(file, "avatars");
  const updated = await users.updateAvatarUrl(userId, avatarUrl);
  return ok(toPublicUser(updated));
}

export async function setUserAvatarVariant(
  userId: string,
  variant: string,
  users: UserRepository,
  storage: FileStorage,
  seed?: string | null,
): Promise<Result<PublicUser>> {
  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  const next: AvatarVariant = parseAvatarVariant(variant);
  if (user.avatarUrl) {
    await storage.remove(user.avatarUrl);
  }

  const nextSeed =
    seed === undefined ? undefined : seed?.trim() ? seed.trim().slice(0, 64) : null;
  const updated = await users.updateAvatarVariant(userId, next, nextSeed);
  return ok(toPublicUser(updated));
}

export async function removeUserAvatar(
  userId: string,
  users: UserRepository,
  storage: FileStorage,
): Promise<Result<PublicUser>> {
  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  if (user.avatarUrl) {
    await storage.remove(user.avatarUrl);
  }

  const updated = await users.updateAvatarUrl(userId, null);
  return ok(toPublicUser(updated));
}
