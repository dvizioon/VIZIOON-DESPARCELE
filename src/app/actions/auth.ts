"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";
import { registerUser } from "@/modules/auth/application/register-user";
import { requestPasswordReset, resetPassword } from "@/modules/auth/application/reset-password";
import { dispatchMail } from "@/modules/mail/application/dispatch-mail";
import { formatMailDate, getAppOrigin } from "@/shared/config/app-origin";
import { requireUser } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";

export type ActionState = {
  error: string | null;
  ok?: boolean;
  message?: string;
  debtId?: string;
  installmentId?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/workspaces");
  const preview = await authenticateUser(email, password, getRepositories().users);

  if (!preview.ok) {
    return { error: preview.error.message };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/workspaces",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha invalidos" };
    }

    throw error;
  }

  return { error: null };
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { users, admin } = getRepositories();
  const settings = await admin.getSystemSettings();
  if (!settings.allowPublicSignup) {
    return { error: "Neste momento nao e possivel criar conta." };
  }

  const result = await registerUser(
    {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    },
    users,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  const origin = await getAppOrigin();
  void dispatchMail(
    "welcome",
    result.value.email,
    {
      nome: result.value.name,
      email: result.value.email,
      data: formatMailDate(),
      link: `${origin}/login`,
    },
    getRepositories().mail,
  ).catch(() => undefined);

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/workspaces",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada. Entre novamente." };
    }

    throw error;
  }

  return { error: null };
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { users, mail } = getRepositories();
  const result = await requestPasswordReset(String(formData.get("email") ?? ""), users);

  if (!result.ok) {
    return { error: result.error.message };
  }

  if (result.value.notify) {
    const origin = await getAppOrigin();
    void dispatchMail(
      "password_reset",
      result.value.notify.email,
      {
        nome: result.value.notify.name,
        email: result.value.notify.email,
        data: formatMailDate(),
        link: `${origin}/redefinir-senha?token=${result.value.notify.token}`,
      },
      mail,
    ).catch(() => undefined);
  }

  return { error: null, ok: true };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { users } = getRepositories();
  const result = await resetPassword(
    String(formData.get("token") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("confirmPassword") ?? ""),
    users,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/login?redefinida=1");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { users } = getRepositories();
  const { updateUserProfile } = await import("@/modules/auth/application/manage-profile");
  const result = await updateUserProfile(
    user.id,
    {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    },
    users,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/workspaces");
  return { error: null, ok: true, message: "Perfil salvo." };
}

export async function uploadAvatarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { users, storage } = getRepositories();
  const { uploadUserAvatar } = await import("@/modules/auth/application/manage-avatar");
  const file = formData.get("avatar");

  let payload: { buffer: Buffer; filename: string; mimeType: string } | null = null;
  if (file instanceof File && file.size > 0) {
    payload = {
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name || "avatar.jpg",
      mimeType: file.type || "image/jpeg",
    };
  }

  const result = await uploadUserAvatar(user.id, payload, users, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/workspaces");
  return { error: null, ok: true, message: "Foto atualizada." };
}

export async function removeAvatarAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { users, storage } = getRepositories();
  const { removeUserAvatar } = await import("@/modules/auth/application/manage-avatar");
  const result = await removeUserAvatar(user.id, users, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/workspaces");
  return { error: null, ok: true, message: "Voltando ao avatar gerado." };
}

export async function requestProfilePasswordResetAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { users, mail } = getRepositories();
  const result = await requestPasswordReset(user.email, users);

  if (!result.ok) {
    return { error: result.error.message };
  }

  if (result.value.notify) {
    const origin = await getAppOrigin();
    void dispatchMail(
      "password_reset",
      result.value.notify.email,
      {
        nome: result.value.notify.name,
        email: result.value.notify.email,
        data: formatMailDate(),
        link: `${origin}/redefinir-senha?token=${result.value.notify.token}`,
      },
      mail,
    ).catch(() => undefined);
  }

  return {
    error: null,
    ok: true,
    message: "Enviamos um e-mail com o link para mudar a senha.",
  };
}

export async function closeAccountAction(): Promise<ActionState> {
  const user = await requireUser();
  const { users } = getRepositories();
  const { closeUserAccount } = await import("@/modules/auth/application/manage-profile");
  const result = await closeUserAccount(user.id, users);
  if (!result.ok) {
    return { error: result.error.message };
  }

  await signOut({ redirectTo: "/login?desativada=1" });
  redirect("/login?desativada=1");
}
