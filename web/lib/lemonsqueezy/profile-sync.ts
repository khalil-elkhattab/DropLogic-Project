import type { SupabaseClient } from '@supabase/supabase-js';
import type { LemonSqueezyWebhookEvent } from './types';
import { PLAN_STATUS } from '@/lib/plan-status';

type ProfilePlan =
  | 'free'
  | 'pro'
  | 'Pro_Monthly'
  | 'LTD'
  | 'LTD_Direct'
  | 'LTD_AppSumo'
  | 'credits';

type UserTier =
  | 'free'
  | 'premium'
  | 'appsumo_tier1'
  | 'appsumo_tier2'
  | 'appsumo_tier3';

function resolveUserTierForPlan(planStatus: ProfilePlan): UserTier {
  const normalized = planStatus.toLowerCase();
  if (
    normalized === 'pro' ||
    normalized === 'pro_monthly' ||
    normalized === 'credits' ||
    normalized === 'ltd' ||
    normalized === 'ltd_direct'
  ) {
    return 'premium';
  }
  return 'free';
}

type SyncProfileInput = {
  email: string;
  clerkUserId?: string | null;
  planStatus: ProfilePlan;
  subscriptionId?: string;
  orderId?: string;
};

export function resolveWebhookIdentity(event: LemonSqueezyWebhookEvent): {
  email: string | null;
  clerkUserId: string | null;
} {
  const email = event.data.attributes.user_email?.trim().toLowerCase() || null;
  const clerkUserId =
    event.meta.custom_data?.clerk_user_id?.trim() ||
    event.meta.custom_data?.clerkUserId?.trim() ||
    null;

  return { email, clerkUserId };
}

export function isActiveSubscriptionStatus(status: string | undefined): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized === 'active' || normalized === 'on_trial' || normalized === 'paused';
}

export function isProSubscriptionProduct(
  productId: number,
  variantId: number,
): boolean {
  const proProductId = process.env.LEMONSQUEEZY_PRO_PRODUCT_ID;
  const proVariantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;

  if (!proProductId && !proVariantId) {
    return true;
  }

  if (proVariantId && variantId.toString() === proVariantId) {
    return true;
  }

  if (proProductId && productId.toString() === proProductId) {
    return true;
  }

  return false;
}

export async function findProfile(
  supabase: SupabaseClient,
  email: string,
  clerkUserId?: string | null,
) {
  if (clerkUserId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, clerk_user_id, plan_status, user_tier, appsumo_codes_count')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, clerk_user_id, plan_status, user_tier, appsumo_codes_count')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function syncProfilePlan(
  supabase: SupabaseClient,
  input: SyncProfileInput,
): Promise<void> {
  const existing = await findProfile(supabase, input.email, input.clerkUserId);

  if (input.planStatus === 'free') {
    const existingTier = (existing?.user_tier || '').toLowerCase();
    const existingPlan = (existing?.plan_status || '').toLowerCase();
    if (
      existingPlan === 'ltd_appsumo' ||
      existingPlan === 'ltd_direct' ||
      existingPlan === 'ltd' ||
      existingTier.startsWith('appsumo_')
    ) {
      return;
    }
  }

  const existingTier = (existing?.user_tier || '').toLowerCase();
  const nextTier =
    existingTier.startsWith('appsumo_') && input.planStatus !== 'free'
      ? existingTier
      : resolveUserTierForPlan(input.planStatus);

  const row: Record<string, string | number | null> = {
    email: input.email,
    plan_status: input.planStatus,
    user_tier: nextTier,
    updated_at: new Date().toISOString(),
  };

  if (input.clerkUserId) {
    row.clerk_user_id = input.clerkUserId;
  } else if (existing?.clerk_user_id) {
    row.clerk_user_id = existing.clerk_user_id;
  }

  if (input.subscriptionId) {
    row.lemon_squeezy_subscription_id = input.subscriptionId;
  }

  if (input.orderId) {
    row.lemon_squeezy_order_id = input.orderId;
  }

  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'email' });

  if (error) {
    throw error;
  }
}

export async function markWebhookProcessed(
  supabase: SupabaseClient,
  eventId: string,
  eventName: string,
): Promise<boolean> {
  const { data: existing, error: lookupError } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing) {
    return false;
  }

  const { error: insertError } = await supabase.from('webhook_events').insert({
    id: eventId,
    event_name: eventName,
  });

  if (insertError) {
    throw insertError;
  }

  return true;
}

export function buildWebhookEventId(event: LemonSqueezyWebhookEvent): string {
  const updatedAt = event.data.attributes.updated_at;
  if (updatedAt) {
    return `${event.meta.event_name}:${event.data.id}:${updatedAt}`;
  }
  return `${event.meta.event_name}:${event.data.id}`;
}
