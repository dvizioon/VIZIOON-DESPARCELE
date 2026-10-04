import {
  isSeedMasterAdmin,
  isSystemAdmin,
  parseSystemRole,
  type SystemRole,
} from "@/modules/auth/domain/user";
import { fail, ok, type Result } from "@/shared/types/result";
import type { AdminRepository } from "../domain/admin-repository";

export async function setUserRole(
  actorId: string,
  userId: string,
  roleValue: string,
  admin: AdminRepository,
): Promise<Result<{ role: SystemRole }>> {
  const role = parseSystemRole(roleValue);
  if (!role) {
    return fail("INVALID_ROLE", "Papel invalido");
  }

  const target = await admin.findUser(userId);
  if (!target) {
    return fail("NOT_FOUND", "Usuario nao encontrado");
  }

  if (isSeedMasterAdmin(target.email) && role !== "ADMIN") {
    return fail("MASTER", "A conta mestre continua admin");
  }

  if (target.id === actorId && role !== "ADMIN") {
    return fail("SELF", "Voce nao pode tirar o proprio acesso de admin");
  }

  if (isSystemAdmin(target.systemRole) && role !== "ADMIN" && !target.disabledAt) {
    const admins = await admin.countActiveAdmins();
    if (admins <= 1) {
      return fail("LAST_ADMIN", "Precisa ficar pelo menos um admin ativo");
    }
  }

  await admin.setUserRole(userId, role);
  return ok({ role });
}
