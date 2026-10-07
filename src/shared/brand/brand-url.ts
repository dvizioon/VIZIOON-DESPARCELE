import { getAppOrigin } from "@/shared/config/app-origin";

export type BrandAssetKind = "logo" | "favicon";

/** URL pública mascarada, usada nos e-mails e no favicon. Sem I/O. */
export async function publicBrandAssetUrl(kind: BrandAssetKind): Promise<string> {
  const origin = await getAppOrigin();
  return `${origin}/api/brand/${kind}`;
}
