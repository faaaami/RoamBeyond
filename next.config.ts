import type { NextConfig } from "next";

/**
 * Photos uploaded in the Django admin are served by the backend under /media/,
 * or from a bucket's public domain (MEDIA_HOST_URL) when the backend stores
 * them in S3-compatible storage. next/image may only optimise those origins.
 */
const mediaOrigins = [
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  process.env.API_URL,
  process.env.MEDIA_HOST_URL,
].filter((origin): origin is string => Boolean(origin));

const remotePatterns = mediaOrigins.map((origin) => {
  const { protocol, hostname, port } = new URL(origin);
  return {
    protocol: protocol.replace(":", "") as "http" | "https",
    hostname,
    port,
    pathname: process.env.MEDIA_HOST_URL && origin === process.env.MEDIA_HOST_URL ? "/**" : "/media/**",
  };
});

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns,
    // In development the backend runs on localhost, which next/image blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Admin photo uploads travel through Server Actions: allow files up to 10 MB.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // Only meaningful over HTTPS, so it is sent in production builds only.
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
        : []),
    ];
    return [{ source: "/:path*", headers: security }];
  },
};

export default nextConfig;
