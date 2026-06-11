import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

type ProxyOptions = {
  method?: string;
  /** Max time to wait for the droplet response (ms). Keep POST short — job runs in background. */
  timeoutMs?: number;
};

/**
 * Forward a request to FastAPI and preserve the upstream status code (including 202 Accepted).
 */
export async function proxyToBackend(
  request: Request,
  backendPath: string,
  options: ProxyOptions = {},
): Promise<NextResponse> {
  const method = options.method ?? request.method;
  const path = backendPath.startsWith('/') ? backendPath : `/${backendPath}`;
  const url = `${getBackendUrl()}${path}`;
  const timeoutMs = options.timeoutMs ?? 25_000;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to reach analysis backend';
    return NextResponse.json(
      { error: 'backend_unreachable', detail: message },
      { status: 502 },
    );
  }

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
