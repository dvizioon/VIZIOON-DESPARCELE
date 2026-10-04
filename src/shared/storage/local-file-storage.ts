import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { FileStorage, StoredFile } from "./file-storage";

export class LocalFileStorage implements FileStorage {
  constructor(private readonly rootPath: string) {}

  async save(file: StoredFile, folder: string): Promise<string> {
    const extension = path.extname(file.filename) || mimeToExtension(file.mimeType);
    const key = `${folder}/${randomUUID()}${extension}`;
    const absolute = path.join(this.rootPath, key);

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, file.buffer);

    return `/api/files/${key}`;
  }

  async remove(storedUrl: string): Promise<void> {
    const relative = storedUrl.replace(/^\/api\/files\//, "");
    if (!relative || relative.includes("..")) {
      return;
    }

    const absolute = path.resolve(this.rootPath, relative);
    const root = path.resolve(this.rootPath);
    if (!absolute.startsWith(root)) {
      return;
    }

    try {
      await unlink(absolute);
    } catch {
      return;
    }
  }
}

function mimeToExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}
