import { NextRequest, NextResponse } from 'next/server';
import {
  DROPLET_ASSET_ORIGIN,
  extractAssetUrlParam,
  normalizeDropletAssetUrl,
} from '@/lib/asset-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveFilename(request: NextRequest, sourceUrl: string): string {
  const fromQuery = request.nextUrl.searchParams.get('filename');
  if (fromQuery) {
    return fromQuery.replace(/[^\w.\-]/g, '_');
  }

  const basename = sourceUrl.split('/').pop() || 'droplogic-ad.mp4';
  return basename.replace(/[^\w.\-]/g, '_') || 'droplogic-ad.mp4';
}

/**
 * Proxy download from the FastAPI droplet.
 * Allows plain http://164.90.235.14:8000/static/... (no HTTPS on :8000).
 */
export async function GET(request: NextRequest) {
  const rawParam = extractAssetUrlParam(request);
  const sourceUrl = normalizeDropletAssetUrl(rawParam);

  if (!sourceUrl) {
    return NextResponse.json(
      {
        error: 'Invalid or disallowed download URL',
        hint: `Only ${DROPLET_ASSET_ORIGIN}/static/... URLs are allowed (http is OK for droplet)`,
        received: rawParam || request.nextUrl.searchParams.get('url'),
      },
      { status: 400 },
    );
  }

  const filename = resolveFilename(request, sourceUrl);

  try {
    const upstream = await fetch(sourceUrl, {
      cache: 'no-store',
      headers: { Accept: 'video/mp4,application/octet-stream,*/*' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}`, sourceUrl },
        { status: upstream.status },
      );
    }

    const upstreamType = upstream.headers.get('content-type') || '';
    const contentType = upstreamType.includes('video') || sourceUrl.endsWith('.mp4')
      ? 'video/mp4'
      : upstreamType || 'application/octet-stream';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Failed to fetch file for download';
    return NextResponse.json({ error: detail, sourceUrl }, { status: 502 });
  }
}
