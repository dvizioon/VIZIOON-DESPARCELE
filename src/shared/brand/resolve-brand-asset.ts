import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/shared/infrastructure/prisma";
import { createFileStorage } from "@/shared/storage/create-file-storage";
import type { BrandAssetKind } from "./brand-url";

export type { BrandAssetKind } from "./brand-url";

export type BrandAssetPayload = {
  buffer: Buffer;
  mimeType: string;
};

export async function loadBrandAsset(kind: BrandAssetKind): Promise<BrandAssetPayload | null> {
  const row = await prisma.systemConfig.findUnique({ where: { id: "default" } });
  const storedUrl = kind === "logo" ? row?.brandLogoUrl : row?.brandFaviconUrl;

  if (storedUrl) {
    const storage = createFileStorage();
    const file = await storage.read(storedUrl);
    if (file) {
      return file;
    }
  }

  return loadPublicFallback(kind);
}

async function loadPublicFallback(kind: BrandAssetKind): Promise<BrandAssetPayload | null> {
  const candidates =
    kind === "logo"
      ? ["logo.png", "logo.svg"]
      : ["favicon.ico", "favicon.png", "logo.png"];

  for (const name of candidates) {
    try {
      const absolute = path.join(process.cwd(), "public", name);
      const buffer = await readFile(absolute);
      return { buffer, mimeType: mimeFromName(name) };
    } catch {
      continue;
    }
  }

  return null;
}

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
