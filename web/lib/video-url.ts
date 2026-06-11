/**
 * Resolve TikTok / proxy URLs for preview (browser) vs cloud bake (absolute https).
 */

/** Build same-origin proxy URL for in-browser <video> preview. */
export function toProxyPreviewUrl(rawUrl: string): string {
  const source = extractSourceVideoUrl(rawUrl);
  if (!source) return '';
  return `/api/proxy-video?url=${encodeURIComponent(source)}`;
}

/**
 * Unwrap `/api/proxy-video?url=...` or return absolute http(s) URL for baking.
 */
export function extractSourceVideoUrl(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/api/proxy-video')) {
    try {
      const parsed = new URL(trimmed, 'http://localhost');
      const nested = parsed.searchParams.get('url');
      if (nested) return decodeURIComponent(nested).trim();
    } catch {
      return '';
    }
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return '';
  }

  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** Absolute URL required by FastAPI / Json2Video for the source clip. */
export function resolveBakeVideoUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const source = extractSourceVideoUrl(candidate || '');
    if (source && /^https?:\/\//i.test(source)) {
      return source;
    }
  }
  return '';
}

/** Preview URL for studio player (proxy when possible). */
export function resolvePreviewVideoUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const trimmed = candidate.trim();
    if (trimmed.startsWith('/api/')) {
      return trimmed;
    }
    const source = extractSourceVideoUrl(trimmed);
    if (source) {
      return toProxyPreviewUrl(source);
    }
  }
  return '';
}
