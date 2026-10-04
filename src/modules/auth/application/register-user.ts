import { hash } from "bcryptjs";
import { fail, ok, type Result } from "@/shared/types/result";
import { isFullName, normalizeEmail, toPublicUser, type PublicUser } from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function registerUser(
  input: RegisterUserInput,
  users: UserRepository,
): Promise<Result<PublicUser>> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!isFullName(name)) {
    return fail("INVALID_NAME", "Informe seu nome completo");
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
  });

  return ok(toPublicUser(user));
}
