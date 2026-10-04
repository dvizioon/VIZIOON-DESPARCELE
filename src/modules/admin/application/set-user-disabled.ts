import { isSeedMasterAdmin, isSystemAdmin } from "@/modules/auth/domain/user";
import { fail, ok, type Result } from "@/shared/types/result";
import type { AdminRepository } from "../domain/admin-repository";

export async function setUserDisabled(
  actorId: string,
  userId: string,
  disabled: boolean,
  admin: AdminRepository,
): Promise<Result<{ ok: true }>> {
  const target = await admin.findUser(userId);
  if (!target) {
    return fail("NOT_FOUND", "Usuario nao encontrado");
  }

  if (target.id === actorId) {
    return fail("SELF", "Voce nao pode desativar a propria conta");
  }

  if (isSeedMasterAdmin(target.email) && disabled) {
    return fail("MASTER", "A conta mestre nao pode ser desativada");
  }

  if (disabled && isSystemAdmin(target.systemRole) && !target.disabledAt) {
    const admins = await admin.countActiveAdmins();
    if (admins <= 1) {
      return fail("LAST_ADMIN", "Precisa ficar pelo menos um admin ativo");
    }
  }

  await admin.setUserDisabled(userId, disabled ? new Date() : null);
  return ok({ ok: true });
}
