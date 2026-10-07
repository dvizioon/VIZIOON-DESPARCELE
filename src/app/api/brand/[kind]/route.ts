import { NextResponse } from "next/server";
import { loadBrandAsset, type BrandAssetKind } from "@/shared/brand/resolve-brand-asset";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ kind: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { kind: raw } = await context.params;
  if (raw !== "logo" && raw !== "favicon") {
    return new NextResponse("Not found", { status: 404 });
  }

  const kind = raw as BrandAssetKind;
  const asset = await loadBrandAsset(kind);
  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.buffer), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
