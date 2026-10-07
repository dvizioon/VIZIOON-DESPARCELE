export type SystemRole = "MEMBER" | "ADMIN";

export const EMAIL_VERIFY_GRACE_MS = 24 * 60 * 60 * 1000;
export const EMAIL_VERIFY_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export const AVATAR_VARIANTS = [
  "beam",
  "marble",
  "pixel",
  "sunset",
  "ring",
  "bauhaus",
] as const;

export type AvatarVariant = (typeof AVATAR_VARIANTS)[number];

export function parseAvatarVariant(value: string | null | undefined): AvatarVariant {
  if (value && (AVATAR_VARIANTS as readonly string[]).includes(value)) {
    return value as AvatarVariant;
  }
  return "beam";
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarVariant: AvatarVariant;
  avatarSeed: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  systemRole: SystemRole;
  disabledAt: Date | null;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarVariant: AvatarVariant;
  avatarSeed: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  systemRole: SystemRole;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    avatarVariant: user.avatarVariant,
    avatarSeed: user.avatarSeed,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    systemRole: user.systemRole,
  };
}

/** Seed visual do boring-avatars (nome da pessoa ou seed aleatório). */
export function avatarRenderSeed(user: {
  name: string;
  avatarSeed?: string | null;
}): string {
  return user.avatarSeed?.trim() || user.name || "pessoa";
}

export function newAvatarSeed(): string {
  return `av-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/** Sem verificação e já passou da janela de 24h → só entra depois de verificar. */
export function mustVerifyEmail(
  user: Pick<User, "emailVerifiedAt" | "createdAt">,
  now = new Date(),
): boolean {
  if (user.emailVerifiedAt) {
    return false;
  }
  return now.getTime() - user.createdAt.getTime() > EMAIL_VERIFY_GRACE_MS;
}

export function isEmailVerified(user: Pick<User, "emailVerifiedAt">): boolean {
  return user.emailVerifiedAt != null;
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
