import { NextRequest, NextResponse } from 'next/server';
import { isAllowedBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

/** Proxies baked assets from the FastAPI backend for in-browser video preview (CORS / mixed-content safe). */
export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');

  if (!sourceUrl || !isAllowedBackendUrl(sourceUrl)) {
    return NextResponse.json({ error: 'Invalid or disallowed media URL' }, { status: 400 });
  }

  try {
    const range = request.headers.get('range') ?? undefined;
    const upstream = await fetch(sourceUrl, {
      cache: 'no-store',
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
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
  } catch {
    return NextResponse.json({ error: 'Failed to stream media' }, { status: 502 });
  }
}
