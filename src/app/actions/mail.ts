"use server";

import { revalidatePath } from "next/cache";
import { retryOutbox } from "@/modules/mail/application/dispatch-mail";
import { savePurposeRoute, saveSmtpProvider, testPurpose, testSmtpProvider } from "@/modules/mail/application/manage-mail";
import { requireSystemAdmin } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import type { ActionState } from "./auth";

function revalidateMail() {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/configuracoes/smtp");
  revalidatePath("/admin/configuracoes/email");
  revalidatePath("/admin/configuracoes/fila");
}

export async function saveSmtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await saveSmtpProvider(
    {
      id: id || undefined,
      name: String(formData.get("name") ?? ""),
      host: String(formData.get("host") ?? ""),
      port: Number(formData.get("port") ?? 587),
      secure: formData.get("secure") === "on",
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      fromAddress: String(formData.get("fromAddress") ?? ""),
      replyTo: String(formData.get("replyTo") ?? ""),
      active: formData.get("active") === "on",
      isDefault: formData.get("isDefault") === "on",
    },
    getRepositories().mail,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateMail();
  return { error: null, ok: true };
}

export async function deleteSmtpAction(id: string): Promise<ActionState> {
  await requireSystemAdmin();
  await getRepositories().mail.deleteProvider(id);
  revalidateMail();
  return { error: null, ok: true };
}

export async function testSmtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await testSmtpProvider(
    String(formData.get("providerId") ?? ""),
    String(formData.get("to") ?? ""),
    formData.get("format") === "TEXT" ? "TEXT" : "HTML",
    String(formData.get("message") ?? ""),
    getRepositories().mail,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateMail();
  return { error: null, ok: true };
}

export async function savePurposeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await savePurposeRoute(
    {
      purpose: String(formData.get("purpose") ?? ""),
      providerId: String(formData.get("providerId") ?? "") || null,
      subjectTemplate: String(formData.get("subjectTemplate") ?? ""),
      bodyTemplate: String(formData.get("bodyTemplate") ?? ""),
      bodyFormat: formData.get("bodyFormat") === "TEXT" ? "TEXT" : "HTML",
      active: formData.get("active") === "on",
    },
    getRepositories().mail,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateMail();
  return { error: null, ok: true };
}

export async function testPurposeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await testPurpose(
    String(formData.get("purpose") ?? ""),
    String(formData.get("to") ?? ""),
    getRepositories().mail,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateMail();
  return { error: null, ok: true };
}

export async function retryOutboxAction(id: string): Promise<ActionState> {
  await requireSystemAdmin();
  const result = await retryOutbox(id, getRepositories().mail);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidateMail();
  return { error: null, ok: true };
}
