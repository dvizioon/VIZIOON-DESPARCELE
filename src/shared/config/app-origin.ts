import { headers } from "next/headers";

export async function getAppOrigin(): Promise<string> {
  const fromRequest = await originFromRequest();
  if (fromRequest) {
    return fromRequest;
  }

  const fromEnv = (process.env.AUTH_URL || process.env.NEXTAUTH_URL)?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const port = process.env.PORT?.trim() || "7250";
  return `http://localhost:${port}`;
}

export function formatMailDate(date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function withPublicOrigin(value: string, origin: string): string {
  return value.replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi, origin);
}

async function originFromRequest(): Promise<string | null> {
  try {
    const incoming = await headers();
    const host = first(incoming.get("x-forwarded-host")) || first(incoming.get("host"));
    if (!host) {
      return null;
    }

    const proto =
      first(incoming.get("x-forwarded-proto")) ||
      (isLoopback(host) ? "http" : "https");

    return `${proto}://${host}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function first(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function isLoopback(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1";
}
