import type { NextConfig } from "next";

const DEFAULT_BACKEND_ORIGIN = "http://164.90.235.14:8001";

/**
 * Normalize an external rewrite origin (scheme + host only, no path).
 */
function normalizeRewriteOrigin(
  raw: string | undefined,
  fallback: string,
  options: { defaultProtocol?: "http" | "https" } = {},
): string {
  const defaultProtocol = options.defaultProtocol ?? "https";
  const safeFallback = fallback.replace(/\/$/, "");

  const trimmed = (raw ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) {
    return safeFallback;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `${defaultProtocol}://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return safeFallback;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return safeFallback;
  }
}

/**
 * FastAPI droplet origin for paths that still use Next.js rewrites (no Route Handler).
 * Set BACKEND_REWRITE_URL in Vercel → e.g. http://164.90.235.14:8001
 *
 * Analysis uses dedicated Route Handlers (bypasses external rewrite quirks):
 *   - app/api/run-analysis/route.ts
 *   - app/api/analysis-status/[taskId]/route.ts
 */
const BACKEND_ORIGIN = normalizeRewriteOrigin(
  process.env.BACKEND_REWRITE_URL || process.env.NEXT_SERVER_FASTAPI_URL,
  DEFAULT_BACKEND_ORIGIN,
  { defaultProtocol: "http" },
);

/** Bump to force fresh Vercel edge + build cache when debugging routing. */
const DEPLOY_CACHE_BUST =
  process.env.DEPLOY_CACHE_BUST ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  "activate-appsumo-cache-bust-v5";

/** Clerk DNS Frontend API — not a same-origin proxy path. */
const CLERK_FRONTEND_API_URL = (
  process.env.NEXT_PUBLIC_CLERK_FAPI || "https://clerk.droplogicai.com"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    BACKEND_REWRITE_URL: process.env.BACKEND_REWRITE_URL || DEFAULT_BACKEND_ORIGIN,
    NEXT_PUBLIC_DEPLOY_CACHE_BUST: DEPLOY_CACHE_BUST,
    /** Force DNS mode — overrides stale Vercel NEXT_PUBLIC_CLERK_PROXY_URL at build time. */
    NEXT_PUBLIC_CLERK_PROXY_URL: "",
    NEXT_PUBLIC_CLERK_FAPI: CLERK_FRONTEND_API_URL,
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
      beforeFiles: [
        {
          source: "/api/video-studio/published-assets",
          destination: `${backend}/api/video-studio/published-assets`,
        },
        {
          source: "/api/video-studio/download-audio/:path*",
          destination: `${backend}/api/video-studio/download-audio/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
