import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy → FastAPI POST /api/video-studio/bake.
 * Returns 202 Accepted immediately; FFmpeg runs in a background task on the droplet.
 */
export async function POST(request: Request) {
  return proxyToBackend(request, '/api/video-studio/bake', { timeoutMs: 20_000 });
}
