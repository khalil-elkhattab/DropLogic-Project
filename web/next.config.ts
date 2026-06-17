import type { NextConfig } from "next";

/**
 * FastAPI droplet origin for paths that still use Next.js rewrites (no Route Handler).
 * Set BACKEND_REWRITE_URL in Vercel → e.g. http://164.90.235.14:8000
 *
 * Analysis uses dedicated Route Handlers (bypasses external rewrite quirks):
 *   - app/api/run-analysis/route.ts
 *   - app/api/analysis-status/[taskId]/route.ts
 */
const BACKEND_ORIGIN = (
  process.env.BACKEND_REWRITE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_SERVER_FASTAPI_URL ||
  "http://164.90.235.14:8000"
).replace(/\/$/, "");

/** Bump to force fresh Vercel edge + build cache when debugging routing. */
const DEPLOY_CACHE_BUST =
  process.env.DEPLOY_CACHE_BUST ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  "activate-appsumo-cache-bust-v5";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_DEPLOY_CACHE_BUST: DEPLOY_CACHE_BUST,
  },
  generateBuildId: async () => DEPLOY_CACHE_BUST,
  async headers() {
    return [
      {
        source: "/activate-appsumo",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "X-Deploy-Cache-Bust", value: DEPLOY_CACHE_BUST },
          { key: "X-Middleware-Override", value: "none" },
        ],
      },
      {
        source: "/activate-appsumo/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "X-Deploy-Cache-Bust", value: DEPLOY_CACHE_BUST },
          { key: "X-Middleware-Override", value: "none" },
        ],
      },
    ];
  },
  async rewrites() {
    const backend = BACKEND_ORIGIN;

    return {
      // Paths without a matching file in app/api/ — proxy straight to FastAPI.
      beforeFiles: [
        {
          source: "/api/video-studio/bake",
          destination: `${backend}/api/video-studio/bake`,
        },
        {
          source: "/api/video-studio/render-status/:path*",
          destination: `${backend}/api/video-studio/render-status/:path*`,
        },
        {
          source: "/api/video-studio/published-assets",
          destination: `${backend}/api/video-studio/published-assets`,
        },
        {
          source: "/api/video-studio/download-audio/:path*",
          destination: `${backend}/api/video-studio/download-audio/:path*`,
        },
      ],
      // Catch-all for any other /api/* not handled by app/api Route Handlers.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${backend}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
