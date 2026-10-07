import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage, StoredFile, StoredFileRead } from "./file-storage";

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
    const relative = this.toRelative(storedUrl);
    if (!relative) {
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

  async read(storedUrl: string): Promise<StoredFileRead | null> {
    const relative = this.toRelative(storedUrl);
    if (!relative) {
      return null;
    }

    const absolute = path.resolve(this.rootPath, relative);
    const root = path.resolve(this.rootPath);
    if (!absolute.startsWith(root)) {
      return null;
    }

    try {
      const buffer = await readFile(absolute);
      const extension = path.extname(absolute).toLowerCase();
      return { buffer, mimeType: extensionToMime(extension) };
    } catch {
      return null;
    }
  }

  private toRelative(storedUrl: string): string | null {
    const relative = storedUrl.replace(/^\/api\/files\//, "").replace(/^\//, "");
    if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
      return null;
    }
    return relative;
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
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return ".ico";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

function extensionToMime(extension: string): string {
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
