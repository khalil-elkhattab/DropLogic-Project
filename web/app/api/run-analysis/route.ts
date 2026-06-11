import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Thin proxy → FastAPI POST /api/run-analysis.
 * Returns 202 Accepted immediately when the droplet enqueues a background job.
 */
export async function POST(request: Request) {
  return proxyToBackend(request, '/api/run-analysis', { timeoutMs: 15_000 });
}
