import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path: segments } = await context.params;
  const relative = segments.join("/");

  if (relative.includes("..") || path.isAbsolute(relative)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const root = path.resolve(process.env.LOCAL_STORAGE_PATH ?? "./storage");
  const absolute = path.resolve(root, relative);

  if (!absolute.startsWith(root)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const data = await readFile(absolute);
    const extension = path.extname(absolute).toLowerCase();
    const contentType = MIME_BY_EXT[extension] ?? "application/octet-stream";

    return new NextResponse(Uint8Array.from(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
