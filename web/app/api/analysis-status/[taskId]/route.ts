import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

/**
 * Thin proxy → FastAPI GET /api/analysis-status/{task_id}.
 * Each poll is a short request (safe under Vercel limits).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const encodedId = encodeURIComponent(taskId);

  return proxyToBackend(
    new Request(`http://localhost/api/analysis-status/${encodedId}`, { method: 'GET' }),
    `/api/analysis-status/${encodedId}`,
    { method: 'GET', timeoutMs: 15_000 },
  );
}
