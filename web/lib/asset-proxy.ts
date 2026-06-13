import type { NextRequest } from 'next/server';
import { decodeProxyUrl } from '@/lib/backend';

/** FastAPI droplet — static MP4s are served here over plain HTTP (no TLS on :8000). */
export const DROPLET_ASSET_ORIGIN = 'http://164.90.235.14:8000';
export const DROPLET_IP = '164.90.235.14';

/** Decode repeatedly until stable (handles double-encoded query params). */
export function fullyDecodeUrl(raw: string): string {
  let url = raw.trim();
  for (let i = 0; i < 6; i += 1) {
    const next = decodeProxyUrl(url);
    if (next === url) break;
    url = next;
  }
  return url;
}

/**
 * Read the `url` query param from the request.
 */
export function extractAssetUrlParam(request: NextRequest): string {
  const fromSearchParams = request.nextUrl.searchParams.get('url');
  if (fromSearchParams) {
    const decoded = fullyDecodeUrl(fromSearchParams);
    if (decoded && decoded.length > 8) {
      return decoded;
    }
  }

  const rawQuery = request.nextUrl.search.replace(/^\?/, '');
  const key = 'url=';
  const start = rawQuery.indexOf(key);
  if (start === -1) {
    return fullyDecodeUrl(fromSearchParams || '');
  }

  let value = rawQuery.slice(start + key.length);
  const ampersand = value.indexOf('&');
  if (ampersand !== -1) {
    value = value.slice(0, ampersand);
  }

  return fullyDecodeUrl(value);
}

/**
 * If the string contains our droplet IP and `/static/`, it is valid — period.
 * Returns canonical: http://164.90.235.14:8000/static/...
 */
export function normalizeDropletAssetUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  const decoded = fullyDecodeUrl(raw);

  if (decoded.includes(DROPLET_IP) && decoded.includes('/static/')) {
    const staticIndex = decoded.indexOf('/static/');
    const pathOnly = decoded.slice(staticIndex).split(/[?#&]/)[0];
    return `${DROPLET_ASSET_ORIGIN}${pathOnly}`;
  }

  if (decoded.startsWith('/static/')) {
    const pathOnly = decoded.split(/[?#&]/)[0];
    return `${DROPLET_ASSET_ORIGIN}${pathOnly}`;
  }

  if (decoded.startsWith('static/')) {
    const pathOnly = `/${decoded}`.split(/[?#&]/)[0];
    return `${DROPLET_ASSET_ORIGIN}${pathOnly}`;
  }

  return null;
}

export function resolveProxyAssetUrl(request: NextRequest): string | null {
  const raw = extractAssetUrlParam(request);
  if (!raw) return null;
  return normalizeDropletAssetUrl(raw);
}

export function isDropletStaticUrl(url: string): boolean {
  const decoded = fullyDecodeUrl(url);
  return decoded.includes(DROPLET_IP) && decoded.includes('/static/');
}
