import { hash } from "bcryptjs";
import {
  isFullName,
  normalizeEmail,
  parseSystemRole,
  toPublicUser,
  type PublicUser,
} from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import { fail, ok, type Result } from "@/shared/types/result";

export type CreateUserByAdminInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
};

export async function createUserByAdmin(
  input: CreateUserByAdminInput,
  users: UserRepository,
): Promise<Result<PublicUser>> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const role = parseSystemRole(input.role ?? "MEMBER") ?? "MEMBER";

  if (!isFullName(name)) {
    return fail("INVALID_NAME", "Informe o nome completo");
  }

  if (!email.includes("@")) {
    return fail("INVALID_EMAIL", "Informe um e-mail valido");
  }

  if (password.length < 6) {
    return fail("INVALID_PASSWORD", "A senha precisa ter pelo menos 6 caracteres");
  }

  if (password !== input.confirmPassword) {
    return fail("PASSWORD_MISMATCH", "As senhas nao conferem");
  }

  const existing = await users.findByEmail(email);
  if (existing) {
    return fail("EMAIL_TAKEN", "Esse e-mail ja esta em uso");
  }

  const user = await users.create({
    name,
    email,
    passwordHash: await hash(password, 10),
    systemRole: role,
    emailVerified: true,
  });

  return ok(toPublicUser(user));
}
