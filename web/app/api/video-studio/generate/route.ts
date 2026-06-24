import { NextResponse } from 'next/server';
import { getBackendUrl, getBackendUrlSource } from '@/lib/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FALLBACK_SCRIPT = {
  success: true,
  degraded: true,
  script_engine: {
    selected_angle: 'fallback',
    hook_options: [
      'If you want to scale your product, you need to look at this.',
      'Stop scrolling — this product is going viral.',
      'Nobody told me about this until today.',
    ],
    hook: 'If you want to scale your product, you need to look at this.',
    body: 'This product is trending everywhere right now because it solves the biggest problem drop shippers face.',
    cta: 'Get 50% off today only — tap the link in bio before we sell out.',
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_name, angle, video_url } = body;

    if (!product_name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 },
      );
    }

    const targetUrl = `${getBackendUrl()}/api/video-studio/generate`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_name,
        angle,
        video_url: video_url || '',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(
        `[generate] Backend ${response.status} (${getBackendUrlSource()}):`,
        errorText.slice(0, 300),
      );
      return NextResponse.json({
        ...FALLBACK_SCRIPT,
        error: `Python server error: ${response.status}`,
      });
    }

    const pythonData = await response.json();
    return NextResponse.json(pythonData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[generate] Proxy error, returning fallback script:', message);

    return NextResponse.json({
      ...FALLBACK_SCRIPT,
      error: message,
    });
  }
}
