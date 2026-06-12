import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

const FALLBACK_QUOTA = {
  success: true,
  plan_status: 'free',
  limit: Number(process.env.NEXT_PUBLIC_FREE_TIER_VIDEO_LIMIT || 5),
  used: 0,
  remaining: Number(process.env.NEXT_PUBLIC_FREE_TIER_VIDEO_LIMIT || 5),
  allowed: true,
  period: 'lifetime',
  message: 'Usage metrics temporarily unavailable.',
  degraded: true,
};

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    const params = new URLSearchParams({ clerk_user_id: userId });
    if (email) {
      params.set('email', email);
    }

    const response = await fetch(
      `${getBackendUrl()}/api/video-studio/usage?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn('[usage] Backend returned', response.status, errorText);
      return NextResponse.json(FALLBACK_QUOTA);
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      allowed: typeof data.allowed === 'boolean' ? data.allowed : data.remaining > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[usage] Proxy error, returning fallback quota:', message);
    return NextResponse.json(FALLBACK_QUOTA);
  }
}
