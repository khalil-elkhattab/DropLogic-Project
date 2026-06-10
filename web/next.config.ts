import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.BACKEND_REWRITE_URL || "http://164.90.235.14:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
