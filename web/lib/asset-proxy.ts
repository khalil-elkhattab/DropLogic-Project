import type { NextRequest } from 'next/server';
import { decodeProxyUrl, isAllowedBackendUrl } from '@/lib/backend';

/** FastAPI droplet — static MP4s are served here over plain HTTP (no TLS on :8000). */
export const DROPLET_ASSET_ORIGIN = 'http://164.90.235.14:8000';
export const DROPLET_IP = '164.90.235.14';

/**
 * Read the `url` query param even when `http://` was not fully encoded in the request.
 */
export function extractAssetUrlParam(request: NextRequest): string {
  const fromParams = decodeProxyUrl(request.nextUrl.searchParams.get('url'));
  if (fromParams && fromParams.length > 10 && fromParams.includes('/static/')) {
    return fromParams;
  }

  const rawQuery = request.nextUrl.search.replace(/^\?/, '');
  const key = 'url=';
  const start = rawQuery.indexOf(key);
  if (start === -1) {
    return fromParams;
  }

  return decodeProxyUrl(rawQuery.slice(start + key.length));
}

/**
 * Normalize to an absolute droplet URL for server-side fetch.
 * Explicitly allows http://164.90.235.14:8000/static/... (no https required).
 */
export function normalizeDropletAssetUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/static/')) {
    return `${DROPLET_ASSET_ORIGIN}${trimmed}`;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(candidate);

    if (parsed.hostname === DROPLET_IP && parsed.pathname.startsWith('/static/')) {
      const port = parsed.port || '8000';
      return `http://${DROPLET_IP}:${port}${parsed.pathname}${parsed.search}`;
    }

    if (isAllowedBackendUrl(candidate)) {
      return candidate;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveProxyAssetUrl(request: NextRequest): string | null {
  return normalizeDropletAssetUrl(extractAssetUrlParam(request));
}
