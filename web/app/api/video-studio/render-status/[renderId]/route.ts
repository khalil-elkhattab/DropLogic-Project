import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy → FastAPI GET /api/video-studio/render-status/:id (lightweight poll).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ renderId: string }> },
) {
  const { renderId } = await context.params;
  const encoded = encodeURIComponent(renderId);
  return proxyToBackend(
    new Request('http://localhost'),
    `/api/video-studio/render-status/${encoded}`,
    { method: 'GET', timeoutMs: 12_000 },
  );
}
