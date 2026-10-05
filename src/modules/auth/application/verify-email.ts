import { createHash, randomBytes } from "crypto";
import { fail, ok, type Result } from "@/shared/types/result";
import {
  EMAIL_VERIFY_TOKEN_TTL_MS,
  isEmailVerified,
  type PublicUser,
  toPublicUser,
} from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerification(
  userId: string,
  users: UserRepository,
): Promise<Result<{ token: string; email: string; name: string }>> {
  const user = await users.findById(userId);
  if (!user) {
    return fail("NOT_FOUND", "Conta nao encontrada");
  }

  if (isEmailVerified(user)) {
    return fail("ALREADY_VERIFIED", "Este e-mail ja foi verificado");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS);
  await users.replaceEmailVerification(userId, hashToken(token), expiresAt);

  return ok({ token, email: user.email, name: user.name });
}

export async function verifyEmailWithToken(
  token: string,
  users: UserRepository,
): Promise<Result<PublicUser>> {
  if (!token.trim()) {
    return fail("INVALID_TOKEN", "Link invalido");
  }

  const row = await users.findEmailVerification(hashToken(token));
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return fail("INVALID_TOKEN", "Esse link expirou. Peca outro e-mail.");
  }

  const user = await users.markEmailVerified(row.userId);
  await users.deleteEmailVerifications(row.userId);
  return ok(toPublicUser(user));
}
