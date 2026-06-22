import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAppSumoCodeFormat, normalizeAppSumoCode } from '@/lib/appsumo';
import {
  tierActivationMessage,
  tierFromAppsumoCodesCount,
} from '@/lib/appsumo-tiers';

const LIFETIME_PLAN_STATUS = 'LTD_AppSumo';

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

async function countRedeemedAppSumoCodes(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('appsumo_codes')
    .select('*', { count: 'exact', head: true })
    .eq('used_by_user_id', clerkUserId)
    .eq('is_used', true);

  if (error) {
    console.error('[appsumo-activation] code count error:', error.message);
    throw new AppSumoActivationError('Could not verify your AppSumo stack. Please try again.', 500);
  }

  return count ?? 0;
}

async function syncAppSumoStackProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  email: string | null,
) {
  await getOrCreateProfile(supabase, clerkUserId, email);
  const redeemedCount = await countRedeemedAppSumoCodes(supabase, clerkUserId);
  const newTier = tierFromAppsumoCodesCount(redeemedCount);
  const updatedAt = new Date().toISOString();

  const payload: Record<string, string | number> = {
    appsumo_codes_count: redeemedCount,
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
    console.error('[appsumo-activation] profile sync error:', updateError.message);
    throw new AppSumoActivationError('Could not upgrade your plan. Please try again.', 500);
  }

  return {
    userTier: newTier,
    appsumoCodesCount: redeemedCount,
    message: tierActivationMessage(newTier, redeemedCount),
    profile: updated,
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
    const { userTier, appsumoCodesCount, message } = await syncAppSumoStackProfile(
      supabase,
      clerkUserId,
      email,
    );

    return {
      success: true,
      message,
      code,
      plan_status: LIFETIME_PLAN_STATUS,
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
