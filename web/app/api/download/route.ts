import { NextRequest, NextResponse } from 'next/server';
import {
  DROPLET_ASSET_ORIGIN,
  extractAssetUrlParam,
  fullyDecodeUrl,
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

function resolveDownloadUrl(request: NextRequest): { raw: string; sourceUrl: string | null } {
  const candidates = [
    extractAssetUrlParam(request),
    request.nextUrl.searchParams.get('url') || '',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const decoded = fullyDecodeUrl(candidate);
    const sourceUrl = normalizeDropletAssetUrl(decoded);
    if (sourceUrl) {
      return { raw: decoded, sourceUrl };
    }
  }

  return { raw: candidates[0] || '', sourceUrl: null };
}

/**
 * Proxy download from the FastAPI droplet.
 * Any URL containing 164.90.235.14 + /static/ is allowed over plain HTTP.
 */
export async function GET(request: NextRequest) {
  const { raw, sourceUrl } = resolveDownloadUrl(request);

  if (!sourceUrl) {
    return NextResponse.json(
      {
        error: 'Invalid or disallowed download URL',
        hint: `URL must contain ${DROPLET_ASSET_ORIGIN} and /static/`,
        received: raw || request.nextUrl.searchParams.get('url'),
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

    const contentType =
      sourceUrl.endsWith('.mp4') || (upstream.headers.get('content-type') || '').includes('video')
        ? 'video/mp4'
        : upstream.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Failed to fetch file for download';
    return NextResponse.json({ error: detail, sourceUrl }, { status: 502 });
  }
}
