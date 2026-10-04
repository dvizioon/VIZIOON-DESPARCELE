import { hash } from "bcryptjs";
import { fail, ok, type Result } from "@/shared/types/result";
import type { AdminRepository } from "../domain/admin-repository";

export async function setUserPassword(
  userId: string,
  password: string,
  confirmPassword: string,
  admin: AdminRepository,
): Promise<Result<{ ok: true }>> {
  if (password.length < 6) {
    return fail("INVALID_PASSWORD", "A senha precisa ter pelo menos 6 caracteres");
  }

  if (password !== confirmPassword) {
    return fail("PASSWORD_MISMATCH", "As senhas nao conferem");
  }

  const target = await admin.findUser(userId);
  if (!target) {
    return fail("NOT_FOUND", "Usuario nao encontrado");
  }

  await admin.setUserPassword(userId, await hash(password, 10));
  return ok({ ok: true });
}
