import { EMAIL_VERIFY_GRACE_MS, isEmailVerified } from "@/modules/auth/domain/user";

export function graceHoursLeft(
  user: { emailVerifiedAt: Date | null; createdAt: Date },
  now = new Date(),
): number | null {
  if (isEmailVerified(user)) {
    return null;
  }
  const remaining = EMAIL_VERIFY_GRACE_MS - (now.getTime() - user.createdAt.getTime());
  if (remaining <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(remaining / (60 * 60 * 1000)));
}
