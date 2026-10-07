import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isSystemAdmin, mustVerifyEmail } from "@/modules/auth/domain/user";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    systemRole: session.user.systemRole === "ADMIN" ? ("ADMIN" as const) : ("MEMBER" as const),
  };
}

export async function requireUser(options?: { allowUnverified?: boolean }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const stored = await new PrismaUserRepository().findById(user.id);
  if (!stored) {
    redirect("/login");
  }

  if (stored.disabledAt) {
    await signOut({ redirectTo: "/login?desativada=1" });
  }

  if (!options?.allowUnverified && mustVerifyEmail(stored)) {
    redirect("/verificar-email");
  }

  return {
    ...user,
    name: stored.name,
    email: stored.email,
    phone: stored.phone,
    avatarUrl: stored.avatarUrl,
    avatarVariant: stored.avatarVariant,
    avatarSeed: stored.avatarSeed,
    emailVerifiedAt: stored.emailVerifiedAt,
    createdAt: stored.createdAt,
    systemRole: stored.systemRole,
  };
}

export async function requireSystemAdmin() {
  const user = await requireUser();
  if (!isSystemAdmin(user.systemRole)) {
    redirect("/workspaces");
  }

  return user;
}
