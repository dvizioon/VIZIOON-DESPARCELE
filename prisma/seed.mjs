import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const DEFAULT_MASTER = {
  email: "admin@admin.com",
  password: "admin123",
  name: "Admin",
};

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function databaseUrl() {
  const current = process.env.DATABASE_URL?.trim();
  if (current && !current.startsWith("file:")) {
    return current;
  }

  const user = encodeURIComponent(process.env.DB_USER ?? "");
  const pass = encodeURIComponent(process.env.DB_PASS ?? "");
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME ?? "";
  if (!user || !name) {
    throw new Error("Defina DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS.");
  }
  return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

function seedConfig() {
  const email = (process.env.SEED_MASTER_EMAIL ?? DEFAULT_MASTER.email).trim().toLowerCase();
  const password = process.env.SEED_MASTER_PASSWORD ?? DEFAULT_MASTER.password;
  const name = (process.env.SEED_MASTER_NAME ?? DEFAULT_MASTER.name).trim() || DEFAULT_MASTER.name;

  if (!email || !password) {
    console.log("[seed] Seed ignorado: SEED_MASTER_EMAIL ou SEED_MASTER_PASSWORD ausente.");
    return null;
  }

  if (password.length < 6) {
    throw new Error("SEED_MASTER_PASSWORD precisa ter pelo menos 6 caracteres.");
  }

  return { email, password, name };
}

async function seedMasterUser() {
  loadDotEnv();
  const config = seedConfig();
  if (!config) {
    return;
  }

  const { email, password, name } = config;
  process.env.DATABASE_URL = databaseUrl();
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.systemRole !== "ADMIN") {
        await prisma.user.update({
          where: { id: existing.id },
          data: { systemRole: "ADMIN", disabledAt: null },
        });
        console.log(`[seed] Usuário inicial já existe (${email}). Papel Admin garantido.`);
        return;
      }
      console.log(`[seed] Usuário inicial já existe (${email}).`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hash(password, 10),
        systemRole: "ADMIN",
      },
    });
    console.log(`[seed] Usuário inicial criado: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedMasterUser().catch((error) => {
  console.error("[seed] Falhou:", error);
  process.exit(1);
});
