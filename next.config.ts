import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a read-only mirror for GitHub Pages:
// API routes are moved aside by CI and data comes from public/posts.json.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
