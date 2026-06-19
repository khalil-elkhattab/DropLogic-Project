import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  activateAppSumoCodeForUser,
  AppSumoActivationError,
} from '@/lib/appsumo-activation';
import { isSupabaseAdminConfigured } from '@/lib/supabase/admin';

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
  if (!isSupabaseAdminConfigured()) {
    console.error(
      '[activate-appsumo-code] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server env',
    );
    return jsonError(
      'AppSumo redemption is temporarily unavailable. Please try again later.',
      503,
    );
  }

  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
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

  let email: string | null = null;
  try {
    const user = await currentUser();
    email = user?.primaryEmailAddress?.emailAddress ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load user profile';
    console.warn('[activate-appsumo-code] currentUser warning:', message);
  }

  try {
    const result = await activateAppSumoCodeForUser(code, userId, email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppSumoActivationError) {
      return jsonError(error.message, error.status);
    }

    const message = error instanceof Error ? error.message : 'Activation failed';
    console.error('[activate-appsumo-code] Unexpected error:', message);
    return jsonError('Could not activate AppSumo code. Please try again.', 500);
  }
}
