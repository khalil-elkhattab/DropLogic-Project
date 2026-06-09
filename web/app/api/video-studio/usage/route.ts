import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  try {
    const params = new URLSearchParams({ clerk_user_id: userId });
    if (email) {
      params.set('email', email);
    }

    const response = await fetch(
      `${getBackendUrl()}/api/video-studio/usage?${params.toString()}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch usage', detail: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      allowed: typeof data.allowed === 'boolean' ? data.allowed : data.remaining > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
