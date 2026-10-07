import { hash } from "bcryptjs";
import { fail, ok, type Result } from "@/shared/types/result";
import {
  isFullName,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  toPublicUser,
  type PublicUser,
} from "../domain/user";
import type { UserRepository } from "../domain/user-repository";

export interface RegisterUserInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  requireName?: boolean;
  requirePhone?: boolean;
}

export async function registerUser(
  input: RegisterUserInput,
  users: UserRepository,
): Promise<Result<PublicUser>> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const requireName = input.requireName !== false;
  const requirePhone = Boolean(input.requirePhone);

  let name = input.name.trim();
  if (!name && !requireName && email.includes("@")) {
    name = email.split("@")[0] || "Usuário";
  }

  if (requireName && !isFullName(name)) {
    return fail("INVALID_NAME", "Informe seu nome completo");
  }

  if (!name) {
    return fail("INVALID_NAME", "Informe um nome");
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

  const phone = normalizePhone(input.phone ?? "");
  if (requirePhone && !phone) {
    return fail("INVALID_PHONE", "Informe um telefone");
  }
  if (phone && !isValidPhone(phone)) {
    return fail("INVALID_PHONE", "Telefone invalido");
  }

  const existing = await users.findByEmail(email);
  if (existing) {
    return fail("EMAIL_TAKEN", "Esse e-mail ja esta em uso");
  }

  const user = await users.create({
    name,
    email,
    phone,
    passwordHash: await hash(password, 10),
  });

  return ok(toPublicUser(user));
}
