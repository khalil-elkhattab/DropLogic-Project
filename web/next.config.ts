import type { NextConfig } from "next";

const DEFAULT_BACKEND_ORIGIN = "http://164.90.235.14:8000";
const DEFAULT_CLERK_PROXY_API_ORIGIN = "https://frontend-api.clerk.services";
const DEFAULT_CLERK_PROXY_URL = "https://droplogicai.com/v1";

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

/** Normalize a public URL that may include a path (e.g. Clerk proxy base). */
function normalizePublicUrl(
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
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return safeFallback;
  }
}

/**
 * FastAPI droplet origin for paths that still use Next.js rewrites (no Route Handler).
 * Set BACKEND_REWRITE_URL in Vercel → e.g. http://164.90.235.14:8000
 *
 * Analysis uses dedicated Route Handlers (bypasses external rewrite quirks):
 *   - app/api/run-analysis/route.ts
 *   - app/api/analysis-status/[taskId]/route.ts
 */
const BACKEND_ORIGIN = normalizeRewriteOrigin(
  process.env.BACKEND_REWRITE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_SERVER_FASTAPI_URL,
  DEFAULT_BACKEND_ORIGIN,
  { defaultProtocol: "https" },
);

/** Bump to force fresh Vercel edge + build cache when debugging routing. */
const DEPLOY_CACHE_BUST =
  process.env.DEPLOY_CACHE_BUST ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  "activate-appsumo-cache-bust-v5";

const CLERK_PROXY_API_ORIGIN = normalizeRewriteOrigin(
  process.env.CLERK_PROXY_API_ORIGIN,
  DEFAULT_CLERK_PROXY_API_ORIGIN,
  { defaultProtocol: "https" },
);

/** Public proxy base — must match Clerk Dashboard → Domains → proxy URL. */
const CLERK_PROXY_URL = normalizePublicUrl(
  process.env.NEXT_PUBLIC_CLERK_PROXY_URL,
  DEFAULT_CLERK_PROXY_URL,
  { defaultProtocol: "https" },
);

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_DEPLOY_CACHE_BUST: DEPLOY_CACHE_BUST,
    NEXT_PUBLIC_CLERK_PROXY_URL: CLERK_PROXY_URL,
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
    const clerkProxyApi = CLERK_PROXY_API_ORIGIN;

    const beforeFiles: Array<{ source: string; destination: string }> = [
      {
        source: "/v1/:path*",
        destination: `${clerkProxyApi}/v1/:path*`,
      },
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
      ];

    return {
      // Clerk Frontend API proxy (must run before /api catch-all).
      beforeFiles,
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
