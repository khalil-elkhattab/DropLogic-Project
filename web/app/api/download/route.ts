import { NextRequest, NextResponse } from 'next/server';
import { DROPLET_ASSET_ORIGIN, resolveProxyAssetUrl } from '@/lib/asset-proxy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sourceUrl = resolveProxyAssetUrl(request);
  const filename =
    request.nextUrl.searchParams.get('filename')?.replace(/[^\w.\-]/g, '_') ||
    'droplogic-ad.mp4';

  if (!sourceUrl) {
    const raw = request.nextUrl.searchParams.get('url');
    return NextResponse.json(
      {
        error: 'Invalid or disallowed download URL',
        hint: `Only ${DROPLET_ASSET_ORIGIN}/static/... URLs are allowed`,
        received: raw,
      },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(sourceUrl, { cache: 'no-store' });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}`, sourceUrl },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Failed to fetch file for download';
    return NextResponse.json({ error: detail, sourceUrl }, { status: 502 });
  }
}
