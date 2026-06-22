import type { SupabaseClient } from '@supabase/supabase-js';
import type { LemonSqueezyWebhookEvent } from './types';
import { PLAN_STATUS } from '@/lib/plan-status';

function coerceCustomDataString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function normalizeLemonEnvId(raw: string | undefined): string | null {
  const cleaned = (raw ?? '').trim();
  return cleaned || null;
}

function normalizeLemonResourceId(value: number | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const cleaned = String(value).trim();
  return cleaned || null;
}

export function matchesLemonProduct(
  productId: number | string | null | undefined,
  variantId: number | string | null | undefined,
  configuredProductId: string | undefined,
  configuredVariantId: string | undefined,
): boolean {
  const envProductId = normalizeLemonEnvId(configuredProductId);
  const envVariantId = normalizeLemonEnvId(configuredVariantId);

  if (!envProductId && !envVariantId) {
    return true;
  }

  const actualProductId = normalizeLemonResourceId(productId);
  const actualVariantId = normalizeLemonResourceId(variantId);

  if (envVariantId && actualVariantId === envVariantId) {
    return true;
  }

  if (envProductId && actualProductId === envProductId) {
    return true;
  }

  return false;
}

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
  const customData = event.meta.custom_data ?? {};
  const clerkUserId =
    coerceCustomDataString(customData.clerk_user_id) ||
    coerceCustomDataString(customData.clerkUserId) ||
    coerceCustomDataString(customData.user_id) ||
    null;

  return { email, clerkUserId };
}

export function isActiveSubscriptionStatus(status: string | undefined): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized === 'active' || normalized === 'on_trial' || normalized === 'paused';
}

export function isProSubscriptionProduct(
  productId: number | string | null | undefined,
  variantId: number | string | null | undefined,
): boolean {
  return matchesLemonProduct(
    productId,
    variantId,
    process.env.LEMONSQUEEZY_PRO_PRODUCT_ID,
    process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
  );
}

export function isLtdProduct(
  productId: number | string | null | undefined,
  variantId: number | string | null | undefined,
): boolean {
  return matchesLemonProduct(
    productId,
    variantId,
    process.env.LEMONSQUEEZY_LTD_PRODUCT_ID,
    process.env.LEMONSQUEEZY_LTD_VARIANT_ID,
  );
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

  const resolvedClerkUserId =
    input.clerkUserId || existing?.clerk_user_id || null;

  const row: Record<string, string | number | null> = {
    email: existing?.email ?? input.email,
    plan_status: input.planStatus,
    user_tier: nextTier,
    updated_at: new Date().toISOString(),
  };

  if (resolvedClerkUserId) {
    row.clerk_user_id = resolvedClerkUserId;
  }

  if (input.subscriptionId) {
    row.lemon_squeezy_subscription_id = input.subscriptionId;
  }

  if (input.orderId) {
    row.lemon_squeezy_order_id = input.orderId;
  }

  if (existing?.id) {
    const { error } = await supabase.from('profiles').update(row).eq('id', existing.id);
    if (error) {
      throw error;
    }
    return;
  }

  const conflictKey = resolvedClerkUserId ? 'clerk_user_id' : 'email';
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: conflictKey });

  if (error) {
    throw error;
  }
}

export async function hasWebhookBeenProcessed(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const { data: existing, error: lookupError } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  return Boolean(existing);
}

export async function markWebhookProcessed(
  supabase: SupabaseClient,
  eventId: string,
  eventName: string,
): Promise<void> {
  const { error: insertError } = await supabase.from('webhook_events').insert({
    id: eventId,
    event_name: eventName,
  });

  if (insertError) {
    throw insertError;
  }
}

export function buildWebhookEventId(event: LemonSqueezyWebhookEvent): string {
  const updatedAt = event.data.attributes.updated_at;
  if (updatedAt) {
    return `${event.meta.event_name}:${event.data.id}:${updatedAt}`;
  }
  return `${event.meta.event_name}:${event.data.id}`;
}
