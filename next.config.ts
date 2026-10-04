import type { NextConfig } from "next";

function hostnameFrom(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const allowedDevOrigins = Array.from(
  new Set(
    [
      hostnameFrom(process.env.AUTH_URL),
      hostnameFrom(process.env.NEXTAUTH_URL),
      "*.trycloudflare.com",
      "*.ngrok-free.app",
      "*.ngrok.app",
      "*.ngrok.io",
      "*.loca.lt",
    ].filter((host): host is string => Boolean(host) && host !== "localhost" && host !== "127.0.0.1"),
  ),
);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins,
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
