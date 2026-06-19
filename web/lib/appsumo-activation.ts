import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAppSumoCodeFormat, normalizeAppSumoCode } from '@/lib/appsumo';

const LIFETIME_PLAN_STATUS = 'LTD';

export type AppSumoActivationResult = {
  success: true;
  message: string;
  code: string;
  plan_status: string;
  user_tier: string;
  appsumo_codes_count: number;
  lifetime_plan: true;
  redeemed_at: string;
  clerk_user_id: string;
};

export class AppSumoActivationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AppSumoActivationError';
  }
}

function tierFromAppsumoCodesCount(count: number): string {
  if (count >= 3) return 'appsumo_tier3';
  if (count === 2) return 'appsumo_tier2';
  if (count >= 1) return 'appsumo_tier1';
  return 'free';
}

function tierActivationMessage(userTier: string, appsumoCodesCount: number): string {
  if (userTier === 'appsumo_tier3') {
    return (
      `AppSumo code activated (${appsumoCodesCount} codes stacked). ` +
      'You now have unlimited monthly video renders.'
    );
  }
  if (userTier === 'appsumo_tier2') {
    return (
      `AppSumo code activated (${appsumoCodesCount} codes stacked). ` +
      'Your monthly limit is now 300 videos.'
    );
  }
  return (
    `AppSumo code activated (${appsumoCodesCount} code stacked). ` +
    'Your monthly limit is now 100 videos.'
  );
}

async function getOrCreateProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  email: string | null,
) {
  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (lookupError) {
    throw new AppSumoActivationError('Could not load your profile. Please try again.', 500);
  }

  if (existing) {
    return existing;
  }

  const row = {
    clerk_user_id: clerkUserId,
    email: email || `${clerkUserId}@users.droplogic.local`,
    plan_status: 'free',
    user_tier: 'free',
    appsumo_codes_count: 0,
    updated_at: new Date().toISOString(),
  };

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'clerk_user_id' })
    .select('*')
    .maybeSingle();

  if (insertError || !created) {
    throw new AppSumoActivationError('Could not create your profile. Please try again.', 500);
  }

  return created;
}

async function redeemAppSumoCode(
  supabase: SupabaseClient,
  code: string,
  clerkUserId: string,
) {
  const redeemedAt = new Date().toISOString();

  const { data: redeemed, error: redeemError } = await supabase
    .from('appsumo_codes')
    .update({
      is_used: true,
      used_by_user_id: clerkUserId,
      used_at: redeemedAt,
    })
    .eq('code', code)
    .eq('is_used', false)
    .select('*')
    .maybeSingle();

  if (redeemError) {
    console.error('[appsumo-activation] redeem error:', redeemError.message);
    throw new AppSumoActivationError('Could not activate AppSumo code. Please try again.', 500);
  }

  if (redeemed) {
    return { row: redeemed, redeemedAt };
  }

  const { data: existing, error: lookupError } = await supabase
    .from('appsumo_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (lookupError) {
    throw new AppSumoActivationError('Could not verify AppSumo code. Please try again.', 500);
  }

  if (!existing) {
    throw new AppSumoActivationError('Invalid AppSumo code. Please check and try again.', 404);
  }

  if (existing.is_used) {
    throw new AppSumoActivationError('This AppSumo code has already been redeemed.', 409);
  }

  throw new AppSumoActivationError('Could not activate AppSumo code. Please try again.', 500);
}

async function rollbackRedeem(
  supabase: SupabaseClient,
  code: string,
  clerkUserId: string,
) {
  const { error } = await supabase
    .from('appsumo_codes')
    .update({
      is_used: false,
      used_by_user_id: null,
      used_at: null,
    })
    .eq('code', code)
    .eq('used_by_user_id', clerkUserId)
    .eq('is_used', true);

  if (error) {
    console.error('[appsumo-activation] rollback error:', error.message);
  }
}

async function upgradeUserAppSumoTier(
  supabase: SupabaseClient,
  clerkUserId: string,
  email: string | null,
) {
  const profile = await getOrCreateProfile(supabase, clerkUserId, email);
  const currentCount = Number(profile.appsumo_codes_count ?? 0);
  const newCount = currentCount + 1;
  const newTier = tierFromAppsumoCodesCount(newCount);
  const updatedAt = new Date().toISOString();

  const payload: Record<string, string | number> = {
    appsumo_codes_count: newCount,
    user_tier: newTier,
    plan_status: LIFETIME_PLAN_STATUS,
    updated_at: updatedAt,
  };

  if (email) {
    payload.email = email;
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('clerk_user_id', clerkUserId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    console.error('[appsumo-activation] profile upgrade error:', updateError.message);
    throw new AppSumoActivationError('Could not upgrade your plan. Please try again.', 500);
  }

  const nextProfile = updated ?? {
    ...profile,
    appsumo_codes_count: newCount,
    user_tier: newTier,
    plan_status: LIFETIME_PLAN_STATUS,
  };

  return {
    profile: nextProfile,
    userTier: newTier,
    appsumoCodesCount: newCount,
    message: tierActivationMessage(newTier, newCount),
  };
}

export async function activateAppSumoCodeForUser(
  rawCode: string,
  clerkUserId: string,
  email: string | null,
): Promise<AppSumoActivationResult> {
  let supabase: SupabaseClient;

  try {
    supabase = createAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured';
    console.error('[appsumo-activation] config error:', message);
    throw new AppSumoActivationError(
      'AppSumo redemption is temporarily unavailable. Please try again later.',
      503,
    );
  }

  const code = normalizeAppSumoCode(rawCode);

  if (!code) {
    throw new AppSumoActivationError('AppSumo code is required.', 400);
  }

  if (!isValidAppSumoCodeFormat(code)) {
    throw new AppSumoActivationError(
      'Invalid code format. Expected DROPLOGIC-AS-XXXXX (5 uppercase letters or digits).',
      400,
    );
  }

  const { redeemedAt } = await redeemAppSumoCode(supabase, code, clerkUserId);

  try {
    const { userTier, appsumoCodesCount, message } = await upgradeUserAppSumoTier(
      supabase,
      clerkUserId,
      email,
    );

    return {
      success: true,
      message,
      code,
      plan_status: LIFETIME_PLAN_STATUS.toLowerCase(),
      user_tier: userTier,
      appsumo_codes_count: appsumoCodesCount,
      lifetime_plan: true,
      redeemed_at: redeemedAt,
      clerk_user_id: clerkUserId,
    };
  } catch (error) {
    await rollbackRedeem(supabase, code, clerkUserId);
    throw error;
  }
}
