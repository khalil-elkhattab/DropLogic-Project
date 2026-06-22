import { NextResponse } from 'next/server';
import { resolveClerkRouteAuth } from '@/lib/clerk-route-auth';
import { activateAppSumoCodeForUser, AppSumoActivationError } from '@/lib/appsumo-activation';
import { PLAN_STATUS } from '@/lib/plan-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RedeemBody = {
  code?: string;
  license_key?: string;
};

function jsonError(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

/**
 * AppSumo license redemption (users buy on AppSumo, redeem here).
 * Validates code in `appsumo_codes`, marks is_used, links Clerk user, sets LTD_AppSumo.
 */
export async function POST(request: Request) {
  let userId: string | null = null;
  let email: string | null = null;

  try {
    const authState = await resolveClerkRouteAuth(request);
    userId = authState.userId;
    email = authState.email;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('[redeem-appsumo] Clerk auth error:', message);
    return jsonError('Could not verify your session. Please sign in and try again.', 503);
  }

  if (!userId) {
    return jsonError('Unauthorized. Sign in to redeem your AppSumo license.', 401);
  }

  let body: RedeemBody = {};
  try {
    body = (await request.json()) as RedeemBody;
  } catch {
    return jsonError('Invalid request body. Send JSON with a code field.', 400);
  }

  const code = (body.code || body.license_key || '').trim();
  if (!code) {
    return jsonError('AppSumo license code is required.', 400);
  }

  try {
    const result = await activateAppSumoCodeForUser(code, userId, email);

    return NextResponse.json({
      success: true,
      message: result.message,
      code: result.code,
      plan_status: PLAN_STATUS.LTD_APPSUMO,
      user_tier: result.user_tier,
      appsumo_codes_count: result.appsumo_codes_count,
      lifetime_plan: true,
      redeemed_at: result.redeemed_at,
      clerk_user_id: result.clerk_user_id,
    });
  } catch (error) {
    if (error instanceof AppSumoActivationError) {
      return jsonError(error.message, error.status);
    }

    const message = error instanceof Error ? error.message : 'Redemption failed';
    console.error('[redeem-appsumo] unexpected error:', message);
    return jsonError('Could not redeem AppSumo code. Please try again.', 500);
  }
}
