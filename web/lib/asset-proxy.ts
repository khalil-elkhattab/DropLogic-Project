import type { NextRequest } from 'next/server';
import { decodeProxyUrl } from '@/lib/backend';

/** FastAPI droplet — static MP4s are served here over plain HTTP (no TLS on :8000). */
export const DROPLET_ASSET_ORIGIN = 'http://164.90.235.14:8000';
export const DROPLET_IP = '164.90.235.14';
export const DROPLET_HOST = '164.90.235.14:8000';

const DROPLET_STATIC_PATH_RE = /^\/static\/[\w./%-]+$/i;

/**
 * Read and fully decode the `url` query param.
 * Handles encoded URLs and strips trailing params like `&filename=`.
 */
export function extractAssetUrlParam(request: NextRequest): string {
  const fromSearchParams = request.nextUrl.searchParams.get('url');
  if (fromSearchParams) {
    const decoded = decodeProxyUrl(fromSearchParams);
    if (decoded && decoded !== 'http:' && decoded !== 'https:') {
      return decoded;
    }
  }

  const rawQuery = request.nextUrl.search.replace(/^\?/, '');
  const key = 'url=';
  const start = rawQuery.indexOf(key);
  if (start === -1) {
    return decodeProxyUrl(fromSearchParams);
  }

  let value = rawQuery.slice(start + key.length);
  const ampersand = value.indexOf('&');
  if (ampersand !== -1) {
    value = value.slice(0, ampersand);
  }

  return decodeProxyUrl(value);
}

/**
 * Normalize any droplet static asset reference to:
 *   http://164.90.235.14:8000/static/...
 *
 * Explicitly allows plain HTTP for our backend IP (no HTTPS required).
 */
export function normalizeDropletAssetUrl(raw: string | null | undefined): string | null {
  let trimmed = (raw || '').trim();
  if (!trimmed) return null;

  trimmed = decodeProxyUrl(trimmed);
  if (!trimmed) return null;

  if (trimmed.startsWith('/static/')) {
    return `${DROPLET_ASSET_ORIGIN}${trimmed}`;
  }

  if (trimmed.startsWith('static/')) {
    return `${DROPLET_ASSET_ORIGIN}/${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes(DROPLET_IP) || trimmed.startsWith(DROPLET_HOST)) {
      trimmed = `http://${trimmed.replace(/^\/+/, '')}`;
    } else if (trimmed.includes('final_video_') && trimmed.endsWith('.mp4')) {
      const basename = trimmed.split('/').pop() || trimmed;
      return `${DROPLET_ASSET_ORIGIN}/static/outputs/${basename}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname !== DROPLET_IP) {
      return null;
    }

    if (!DROPLET_STATIC_PATH_RE.test(parsed.pathname)) {
      return null;
    }

    const port = parsed.port || '8000';
    return `http://${DROPLET_IP}:${port}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function resolveProxyAssetUrl(request: NextRequest): string | null {
  return normalizeDropletAssetUrl(extractAssetUrlParam(request));
}

export function isDropletStaticUrl(url: string): boolean {
  return normalizeDropletAssetUrl(url) !== null;
}
