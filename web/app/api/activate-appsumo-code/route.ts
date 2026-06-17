import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ActivateBody = {
  code?: string;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ detail: 'Unauthorized. Sign in to activate your AppSumo code.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as ActivateBody;
    const code = (body.code || '').trim();

    if (!code) {
      return NextResponse.json({ detail: 'AppSumo code is required.' }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    const response = await fetch(`${getBackendUrl()}/api/activate-appsumo-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        code,
        clerk_user_id: userId,
        email,
      }),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation proxy failed';
    console.error('[activate-appsumo-code] Proxy error:', message);
    return NextResponse.json(
      { detail: 'Could not reach the activation service. Please try again.' },
      { status: 502 },
    );
  }
}
