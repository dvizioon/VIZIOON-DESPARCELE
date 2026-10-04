"use server";

import { revalidatePath } from "next/cache";
import { createUserByAdmin } from "@/modules/admin/application/create-user";
import { setAllowPublicSignup } from "@/modules/admin/application/set-allow-public-signup";
import { setUserDisabled } from "@/modules/admin/application/set-user-disabled";
import { setUserPassword } from "@/modules/admin/application/set-user-password";
import { setUserRole } from "@/modules/admin/application/set-user-role";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import type { ActionState } from "./auth";

function refreshUsers() {
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/espacos");
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await createUserByAdmin(
    {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      role: String(formData.get("role") ?? "MEMBER"),
    },
    getRepositories().users,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshUsers();
  return { error: null, ok: true };
}

function refreshSignupSettings() {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/configuracoes/cadastro");
  revalidatePath("/login");
  revalidatePath("/register");
}

export async function setAllowPublicSignupAction(enabled: boolean): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setAllowPublicSignup(enabled, getRepositories().admin);

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshSignupSettings();
  return { error: null, ok: true };
}

export async function setUserDisabledAction(formData: FormData): Promise<ActionState> {
  const actor = await requireSystemAdmin();
  const result = await setUserDisabled(
    actor.id,
    String(formData.get("userId") ?? ""),
    String(formData.get("disabled") ?? "") === "1",
    getRepositories().admin,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshUsers();
  return { error: null, ok: true };
}

export async function setUserRoleAction(formData: FormData): Promise<ActionState> {
  const actor = await requireSystemAdmin();
  const result = await setUserRole(
    actor.id,
    String(formData.get("userId") ?? ""),
    String(formData.get("role") ?? ""),
    getRepositories().admin,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshUsers();
  return { error: null, ok: true };
}

export async function setUserPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setUserPassword(
    String(formData.get("userId") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("confirmPassword") ?? ""),
    getRepositories().admin,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshUsers();
  return { error: null, ok: true };
}
