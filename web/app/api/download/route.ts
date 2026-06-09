import { NextRequest, NextResponse } from 'next/server';
import { isAllowedBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');
  const filename =
    request.nextUrl.searchParams.get('filename')?.replace(/[^\w.\-]/g, '_') ||
    'droplogic-ad.mp4';

  if (!sourceUrl || !isAllowedBackendUrl(sourceUrl)) {
    return NextResponse.json({ error: 'Invalid or disallowed download URL' }, { status: 400 });
  }

  try {
    const upstream = await fetch(sourceUrl, { cache: 'no-store' });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
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
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file for download' }, { status: 502 });
  }
}
