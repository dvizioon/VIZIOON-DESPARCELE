import { prisma } from "@/shared/infrastructure/prisma";
import type { CreateUserInput, UserRepository } from "../domain/user-repository";
import { isSeedMasterAdmin, type User } from "../domain/user";

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? mapUser(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const row = await prisma.user.create({ data: input });
    return mapUser(row);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findPasswordReset(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row) {
      return null;
    }

    return { userId: row.userId, expiresAt: row.expiresAt };
  }

  async deletePasswordResets(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  }
}

function mapUser(row: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  systemRole: "MEMBER" | "ADMIN";
  disabledAt: Date | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    systemRole: isSeedMasterAdmin(row.email) ? "ADMIN" : row.systemRole,
    disabledAt: row.disabledAt,
  };
}
