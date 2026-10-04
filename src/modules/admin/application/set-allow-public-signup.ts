import { ok, type Result } from "@/shared/types/result";
import type { AdminRepository } from "../domain/admin-repository";
import type { SystemSettings } from "../domain/platform";

export async function setAllowPublicSignup(
  enabled: boolean,
  admin: AdminRepository,
): Promise<Result<SystemSettings>> {
  const settings = await admin.setAllowPublicSignup(enabled);
  return ok(settings);
}
