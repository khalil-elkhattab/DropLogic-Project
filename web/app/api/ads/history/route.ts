import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/api/ads/history?user_id=${encodeURIComponent(userId)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch ad history', detail: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
