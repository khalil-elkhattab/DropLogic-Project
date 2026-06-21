import { NextResponse } from 'next/server';
import { getBackendUrl, getBackendUrlSource } from '@/lib/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Diagnostic: can Vercel's serverless runtime reach the FastAPI droplet?
 * Open https://www.droplogicai.com/api/backend-health after deploy.
 */
export async function GET() {
  const backendUrl = getBackendUrl();
  const envSource = getBackendUrlSource();
  const started = Date.now();

  try {
    // Empty keyword → FastAPI returns 400 if reachable (proves TCP + HTTP work).
    const response = await fetch(`${backendUrl}/api/run-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });

    const latencyMs = Date.now() - started;
    const bodyText = await response.text();

    return NextResponse.json({
      ok: response.status === 400 || response.status === 202 || response.ok,
      reachable: true,
      backend_url: backendUrl,
      env_source: envSource,
      upstream_status: response.status,
      upstream_snippet: bodyText.slice(0, 200),
      latency_ms: latencyMs,
      interpretation:
        response.status === 400
          ? 'Backend is reachable (400 = expected validation error for empty keyword).'
          : response.status === 202
            ? 'Backend is reachable and async analysis is working.'
            : `Backend responded with HTTP ${response.status}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reachable: false,
        backend_url: backendUrl,
        env_source: envSource,
        latency_ms: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
        interpretation:
          'Vercel cannot open a TCP connection to the droplet. This is NOT an Nginx issue if Nginx is not installed — check UFW, DigitalOcean Cloud Firewall, and that uvicorn listens on 0.0.0.0:8001.',
        droplet_checks: [
          'sudo ss -tlnp | grep 8001   # must show 0.0.0.0:8001',
          'sudo ufw allow 8001/tcp && sudo ufw status',
          'curl -v http://127.0.0.1:8001/docs',
          'curl -v http://164.90.235.14:8001/docs   # from your laptop',
        ],
      },
      { status: 502 },
    );
  }
}
