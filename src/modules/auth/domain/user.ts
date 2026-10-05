export type SystemRole = "MEMBER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
  disabledAt: Date | null;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    systemRole: user.systemRole,
  };
}

export function isSystemAdmin(role: SystemRole): boolean {
  return role === "ADMIN";
}

export function systemRoleLabel(role: SystemRole): string {
  return role === "ADMIN" ? "Admin" : "User";
}

export function parseSystemRole(value: string): SystemRole | null {
  if (value === "ADMIN") {
    return "ADMIN";
  }

  if (value === "MEMBER" || value === "USER") {
    return "MEMBER";
  }

  return null;
}

export function seedMasterEmail(): string {
  return (
    process.env.SEED_MASTER_EMAIL ??
    process.env.SEED_ADMIN_EMAIL ??
    "admin@admin.com"
  ).toLowerCase();
}

export function isSeedMasterAdmin(email: string): boolean {
  return email.trim().toLowerCase() === seedMasterEmail();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function firstName(name: string): string {
  const [value] = name.trim().split(/\s+/);
  return value ?? name;
}

export function isFullName(name: string): boolean {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.replace(/[^\p{L}]/gu, "").length >= 2);

  return parts.length >= 2;
}

/** Telefone BR opcional: só dígitos, 10–11. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return digits;
}

export function isValidPhone(value: string | null): boolean {
  if (value == null) {
    return true;
  }
  return value.length >= 10 && value.length <= 13;
}

export function formatPhoneDisplay(value: string | null): string {
  if (!value) {
    return "";
  }
  const d = value.replace(/\D/g, "");
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return value;
}
