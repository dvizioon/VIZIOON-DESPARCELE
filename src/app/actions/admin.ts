"use server";

import { revalidatePath } from "next/cache";
import { createUserByAdmin } from "@/modules/admin/application/create-user";
import {
  clearBrandFavicon,
  clearBrandLogo,
  uploadBrandFavicon,
  uploadBrandLogo,
} from "@/modules/admin/application/manage-brand";
import { setAllowPublicSignup } from "@/modules/admin/application/set-allow-public-signup";
import { setSignupFields } from "@/modules/admin/application/set-signup-fields";
import type { SignupFields } from "@/modules/admin/domain/platform";
import { setUserDisabled } from "@/modules/admin/application/set-user-disabled";
import { setUserPassword } from "@/modules/admin/application/set-user-password";
import { setUserRole } from "@/modules/admin/application/set-user-role";
import {
  setLoanCronEnabled,
  setLoanCronHour,
  setRecurringCronEnabled,
  setRecurringCronHour,
  setReminderCronEnabled,
  setReminderCronHour,
  setReminderDaysBefore,
} from "@/modules/cron/application/set-loan-cron-settings";
import { retryCronTask, tickLoanCron } from "@/modules/cron/application/tick-loan-cron";
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

export async function setSignupFieldsAction(fields: SignupFields): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setSignupFields(
    {
      name: Boolean(fields.name),
      email: true,
      phone: Boolean(fields.phone),
      password: true,
    },
    getRepositories().admin,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  refreshSignupSettings();
  return { error: null, ok: true };
}

function refreshBrandSettings() {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/configuracoes/marca");
  revalidatePath("/api/brand/logo");
  revalidatePath("/api/brand/favicon");
}

async function readUploadFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    filename: file.name || "upload.png",
    mimeType: file.type || "application/octet-stream",
  };
}

export async function uploadBrandLogoAction(formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const { admin, storage } = getRepositories();
  const result = await uploadBrandLogo(await readUploadFile(formData), admin, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshBrandSettings();
  return { error: null, ok: true, message: "Logo atualizada." };
}

export async function uploadBrandFaviconAction(formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const { admin, storage } = getRepositories();
  const result = await uploadBrandFavicon(await readUploadFile(formData), admin, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshBrandSettings();
  return { error: null, ok: true, message: "Favicon atualizado." };
}

export async function clearBrandLogoAction(): Promise<ActionState> {
  await requireSystemAdmin();
  const { admin, storage } = getRepositories();
  const result = await clearBrandLogo(admin, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshBrandSettings();
  return { error: null, ok: true, message: "Logo voltou ao padrão." };
}

export async function clearBrandFaviconAction(): Promise<ActionState> {
  await requireSystemAdmin();
  const { admin, storage } = getRepositories();
  const result = await clearBrandFavicon(admin, storage);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshBrandSettings();
  return { error: null, ok: true, message: "Favicon voltou ao padrão." };
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

function refreshCronSettings() {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/configuracoes/cron");
}

export async function setLoanCronEnabledAction(enabled: boolean): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setLoanCronEnabled(enabled);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setLoanCronHourAction(hour: number): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setLoanCronHour(hour);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setRecurringCronEnabledAction(enabled: boolean): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setRecurringCronEnabled(enabled);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setRecurringCronHourAction(hour: number): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setRecurringCronHour(hour);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setReminderCronEnabledAction(enabled: boolean): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setReminderCronEnabled(enabled);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setReminderCronHourAction(hour: number): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setReminderCronHour(hour);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function setReminderDaysBeforeAction(days: number): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await setReminderDaysBefore(days);
  if (!result.ok) {
    return { error: result.error.message };
  }
  refreshCronSettings();
  return { error: null, ok: true };
}

export async function processLoanCronNowAction(): Promise<ActionState> {
  await requireSystemAdmin();
  try {
    const result = await tickLoanCron({ forceProcess: true });
    refreshCronSettings();
    return {
      error: null,
      ok: true,
      message: `+${result.enqueued} na fila · ${result.processed} processada(s) · ${result.paidTotal} paga(s) · ${result.createdTotal} gerada(s) · ${result.reminderTotal} e-mail(s)`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao processar fila",
    };
  }
}

export async function retryCronTaskAction(taskId: string): Promise<ActionState> {
  await requireSystemAdmin();
  try {
    const result = await retryCronTask(taskId);
    refreshCronSettings();
    return {
      error: null,
      ok: true,
      message: `${result.paidCount} paga(s) · ${result.createdCount} gerada(s) · ${result.reminderCount} e-mail(s)`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao reprocessar",
    };
  }
}
