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
  // nodemailer usa fs/stream/crypto — não pode ir pro bundle do instrumentation/webpack
  serverExternalPackages: ["@prisma/client", "prisma", "nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const previous = config.externals;
      config.externals = [
        ...(Array.isArray(previous) ? previous : previous ? [previous] : []),
        "nodemailer",
      ];
    }
    return config;
  },
};

export default nextConfig;
