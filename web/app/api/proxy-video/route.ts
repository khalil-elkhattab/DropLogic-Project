import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';
import { fullyDecodeUrl } from '@/lib/asset-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for scraped TikTok / Meta CDN clips (CORS + Range-safe).
 * Droplet static files should use /api/media instead.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw?.trim()) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
  }

  const sourceUrl = fullyDecodeUrl(raw);
  if (!/^https?:\/\//i.test(sourceUrl)) {
    return NextResponse.json({ error: 'url must be absolute http(s)' }, { status: 400 });
  }

  const backend = getBackendUrl().replace(/\/$/, '');
  const upstreamUrl = `${backend}/api/proxy-video?url=${encodeURIComponent(sourceUrl)}`;

  try {
    const range = request.headers.get('range') ?? undefined;
    const upstream = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}`, sourceUrl },
        { status: upstream.status },
      );
    }

    const headers = new Headers();
    const passthrough = ['content-type', 'content-length', 'accept-ranges', 'content-range'];
    for (const key of passthrough) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (!headers.has('content-type')) {
      headers.set('content-type', 'video/mp4');
    }
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Proxy stream failed';
    return NextResponse.json({ error: detail, sourceUrl }, { status: 502 });
  }
}
