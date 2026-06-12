const DEFAULT_BACKEND_ORIGIN = 'http://164.90.235.14:8000';
const DROPLET_IP = '164.90.235.14';

/** Paths we allow media/download proxies to fetch from the backend. */
const ALLOWED_ASSET_PATH_PREFIXES = ['/static/', '/api/'];

/** Decode query param URLs (handles single/double encoding from router params). */
export function decodeProxyUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  let url = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(url);
      if (decoded === url) break;
      url = decoded;
    } catch {
      break;
    }
  }
  return url;
}

function isSafeBackendPath(pathname: string): boolean {
  return ALLOWED_ASSET_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function collectAllowedHosts(): Set<string> {
  const hosts = new Set([
    `${DROPLET_IP}:8000`,
    DROPLET_IP,
    'www.droplogicai.com',
    'droplogicai.com',
  ]);

  for (const origin of [getBackendUrl(), DEFAULT_BACKEND_ORIGIN]) {
    try {
      const parsed = new URL(origin);
      hosts.add(parsed.host);
      if (parsed.hostname) hosts.add(parsed.hostname);
    } catch {
      /* ignore */
    }
  }

  return hosts;
}

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
    const normalized = decodeProxyUrl(url);
    if (!normalized) return false;

    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    if (!isSafeBackendPath(parsed.pathname)) {
      return false;
    }

    const allowedHosts = collectAllowedHosts();

    if (allowedHosts.has(parsed.host) || allowedHosts.has(parsed.hostname)) {
      return true;
    }

    // Always allow droplet static files over plain http (cloud render output).
    if (parsed.hostname === DROPLET_IP) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function resolveBakedVideoUrl(renderId: string): string {
  const uniqueId = renderId.replace(/^local_bake_/, '');
  return buildBackendAssetUrl(`/static/outputs/final_video_${uniqueId}.mp4`);
}
