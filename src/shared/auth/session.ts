import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isSystemAdmin } from "@/modules/auth/domain/user";
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

export async function requireUser() {
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

  return {
    ...user,
    name: stored.name,
    email: stored.email,
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
