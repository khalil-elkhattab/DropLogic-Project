import { NextResponse } from 'next/server';
import { resolveClerkRouteAuth } from '@/lib/clerk-route-auth';
import { getBackendUrl } from '@/lib/backend';

const BACKEND_URL = getBackendUrl();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ActivateBody = {
  code?: string;
};

function jsonError(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function POST(request: Request) {
  let userId: string | null = null;
  let email: string | null = null;

  try {
    const authState = await resolveClerkRouteAuth(request);
    userId = authState.userId;
    email = authState.email;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[activate-appsumo-code] Clerk auth error:', message);
    return jsonError('Could not verify your session. Please sign in and try again.', 503);
  }

  if (!userId) {
    return jsonError('Unauthorized. Sign in to activate your AppSumo code.', 401);
  }

  let body: ActivateBody = {};
  try {
    body = (await request.json()) as ActivateBody;
  } catch {
    return jsonError('Invalid request body. Send JSON with a code field.', 400);
  }

  const code = (body.code || '').trim();
  if (!code) {
    return jsonError('AppSumo code is required.', 400);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/activate-appsumo-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        code,
        clerk_user_id: userId,
        email,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const detail =
        (typeof data.detail === 'string' && data.detail) ||
        (typeof data.error === 'string' && data.error) ||
        'Could not activate AppSumo code. Please try again.';
      return jsonError(detail, response.status);
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation proxy failed';
    console.error('[activate-appsumo-code] Backend fetch error:', message);
    return jsonError('Activation service is unreachable. Please try again in a moment.', 502);
  }
}
