import { NextRequest, NextResponse } from 'next/server';
import { DROPLET_ASSET_ORIGIN, resolveProxyAssetUrl } from '@/lib/asset-proxy';

export const runtime = 'nodejs';

/** Proxies baked assets from the FastAPI droplet for in-browser preview (CORS / mixed-content safe). */
export async function GET(request: NextRequest) {
  const sourceUrl = resolveProxyAssetUrl(request);

  if (!sourceUrl) {
    const raw = request.nextUrl.searchParams.get('url');
    return NextResponse.json(
      {
        error: 'Invalid or disallowed media URL',
        hint: `Only ${DROPLET_ASSET_ORIGIN}/static/... URLs are allowed`,
        received: raw,
      },
      { status: 400 },
    );
  }

  try {
    const range = request.headers.get('range') ?? undefined;
    const upstream = await fetch(sourceUrl, {
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
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Failed to stream media';
    return NextResponse.json({ error: detail, sourceUrl }, { status: 502 });
  }
}
