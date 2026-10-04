import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { fail, ok, type Result } from "@/shared/types/result";
import { normalizeEmail } from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(
  email: string,
  users: UserRepository,
): Promise<Result<{ sent: true; notify?: { email: string; name: string; token: string } }>> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) {
    return fail("INVALID_EMAIL", "Informe um e-mail valido");
  }

  const user = await users.findByEmail(normalized);
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await users.replacePasswordReset(user.id, hashToken(token), expiresAt);
    return ok({ sent: true, notify: { email: user.email, name: user.name, token } });
  }

  return ok({ sent: true });
}

export async function resetPassword(
  token: string,
  password: string,
  confirm: string,
  users: UserRepository,
): Promise<Result<{ ok: true }>> {
  if (password.length < 6) {
    return fail("INVALID_PASSWORD", "A senha precisa ter pelo menos 6 caracteres");
  }

  if (password !== confirm) {
    return fail("PASSWORD_MISMATCH", "As senhas nao conferem");
  }

  const reset = await users.findPasswordReset(hashToken(token));
  if (!reset || reset.expiresAt.getTime() < Date.now()) {
    return fail("INVALID_TOKEN", "Esse pedido expirou. Faca outro.");
  }

  await users.updatePassword(reset.userId, await hash(password, 10));
  await users.deletePasswordResets(reset.userId);
  return ok({ ok: true });
}
