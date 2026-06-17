import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReviewBody = {
  proof?: string;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as ReviewBody;
    const proof = (body.proof || '').trim();
    if (!proof) {
      return NextResponse.json({ detail: 'Review proof is required.' }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    const response = await fetch(`${getBackendUrl()}/api/submit-review-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        clerk_user_id: userId,
        email,
        proof,
      }),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Review proof proxy failed';
    console.error('[submit-review-proof]', message);
    return NextResponse.json({ detail: 'Could not submit review proof.' }, { status: 502 });
  }
}
