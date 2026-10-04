import { compare } from "bcryptjs";
import { fail, ok, type Result } from "@/shared/types/result";
import { normalizeEmail, toPublicUser, type PublicUser } from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

export async function authenticateUser(
  email: string,
  password: string,
  users: UserRepository,
): Promise<Result<PublicUser>> {
  const user = await users.findByEmail(normalizeEmail(email));

  if (!user) {
    return fail("INVALID_CREDENTIALS", "E-mail ou senha invalidos");
  }

  const matches = await compare(password, user.passwordHash);
  if (!matches) {
    return fail("INVALID_CREDENTIALS", "E-mail ou senha invalidos");
  }

  if (user.disabledAt) {
    return fail("ACCOUNT_DISABLED", "Essa conta foi desativada");
  }

  return ok(toPublicUser(user));
}
