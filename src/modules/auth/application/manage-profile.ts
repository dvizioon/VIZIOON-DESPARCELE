import { fail, ok, type Result } from "@/shared/types/result";
import {
  isFullName,
  isSeedMasterAdmin,
  isValidPhone,
  normalizePhone,
  toPublicUser,
  type PublicUser,
} from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

export async function updateUserProfile(
  userId: string,
  input: { name: string; phone: string },
  users: UserRepository,
): Promise<Result<PublicUser>> {
  const name = input.name.trim();
  if (!isFullName(name)) {
    return fail("INVALID_NAME", "Informe seu nome completo");
  }

  const phone = normalizePhone(input.phone);
  if (!isValidPhone(phone)) {
    return fail("INVALID_PHONE", "Telefone invalido. Use DDD + numero.");
  }

  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  const updated = await users.updateProfile(userId, { name, phone });
  return ok(toPublicUser(updated));
}

export async function closeUserAccount(
  userId: string,
  users: UserRepository,
): Promise<Result<{ ok: true }>> {
  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  if (isSeedMasterAdmin(user.email)) {
    return fail("FORBIDDEN", "A conta mestre nao pode ser encerrada por aqui");
  }

  await users.closeAccount(userId);
  return ok({ ok: true });
}
