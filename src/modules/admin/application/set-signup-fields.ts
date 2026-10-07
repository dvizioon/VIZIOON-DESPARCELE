import { ok, type Result } from "@/shared/types/result";
import type { AdminRepository } from "../domain/admin-repository";
import type { SignupFields, SystemSettings } from "../domain/platform";

export async function setSignupFields(
  fields: SignupFields,
  admin: AdminRepository,
): Promise<Result<SystemSettings>> {
  const settings = await admin.setSignupFields(fields);
  return ok(settings);
}
