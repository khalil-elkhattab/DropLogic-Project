const DEFAULT_BACKEND_ORIGIN = 'http://164.90.235.14:8000';

/** Fix malformed values like `http:/host:8000` or bare `host:8000`. */
export function normalizeBackendUrl(raw: string): string {
  let url = raw.trim();
  if (!url) {
    return DEFAULT_BACKEND_ORIGIN;
  }

  // http:/example.com → http://example.com
  url = url.replace(/^(https?):\/([^/])/i, '$1://$2');
  url = url.replace(/\/$/, '');

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  return url;
}

/** Which env var supplied the backend origin (for diagnostics). */
export function getBackendUrlSource():
  | 'BACKEND_REWRITE_URL'
  | 'NEXT_SERVER_FASTAPI_URL'
  | 'NEXT_PUBLIC_BACKEND_URL'
  | 'default' {
  if (process.env.BACKEND_REWRITE_URL?.trim()) {
    return 'BACKEND_REWRITE_URL';
  }
  if (process.env.NEXT_SERVER_FASTAPI_URL?.trim()) {
    return 'NEXT_SERVER_FASTAPI_URL';
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL?.trim()) {
    return 'NEXT_PUBLIC_BACKEND_URL';
  }
  return 'default';
}

/** Absolute FastAPI origin — for server-side proxy routes and asset URL building. */
export function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_REWRITE_URL ||
    process.env.NEXT_SERVER_FASTAPI_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    DEFAULT_BACKEND_ORIGIN;
  return normalizeBackendUrl(raw);
}

/**
 * API path for fetch() calls.
 * In the browser: same-origin `/api/...` (Vercel rewrite → backend, HTTPS-safe).
 * On the server: absolute URL to the FastAPI host.
 */
export function getApiUrl(apiPath: string): string {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (typeof window !== 'undefined') {
    return path;
  }
  return `${getBackendUrl()}${path}`;
}

export function buildBackendAssetUrl(relativeOrAbsolute: string): string {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }
  const path = relativeOrAbsolute.startsWith('/')
    ? relativeOrAbsolute
    : `/${relativeOrAbsolute}`;
  return `${getBackendUrl()}${path}`;
}

export function isAllowedBackendUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const allowedHosts = new Set([
      new URL(getBackendUrl()).host,
      new URL(DEFAULT_BACKEND_ORIGIN).host,
      'www.droplogicai.com',
      'droplogicai.com',
    ]);

    return allowedHosts.has(parsed.host);
  } catch {
    return false;
  }
}

export function resolveBakedVideoUrl(renderId: string): string {
  const uniqueId = renderId.replace(/^local_bake_/, '');
  return buildBackendAssetUrl(`/static/outputs/final_video_${uniqueId}.mp4`);
}
