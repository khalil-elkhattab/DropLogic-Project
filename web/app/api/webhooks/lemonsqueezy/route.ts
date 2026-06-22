import { NextRequest, NextResponse } from 'next/server';
import { verifyLemonSqueezyWebhook } from '@/lib/lemonsqueezy/verify-webhook';
import type { LemonSqueezyWebhookEvent } from '@/lib/lemonsqueezy/types';
import { SUBSCRIPTION_EVENTS } from '@/lib/lemonsqueezy/types';
import {
  buildWebhookEventId,
  isActiveSubscriptionStatus,
  isProSubscriptionProduct,
  markWebhookProcessed,
  resolveWebhookIdentity,
  syncProfilePlan,
} from '@/lib/lemonsqueezy/profile-sync';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_STATUS } from '@/lib/plan-status';

export const runtime = 'nodejs';

function isLtdPurchase(event: LemonSqueezyWebhookEvent): boolean {
  const ltdProductId = process.env.LEMONSQUEEZY_LTD_PRODUCT_ID;
  const ltdVariantId = process.env.LEMONSQUEEZY_LTD_VARIANT_ID;

  if (!ltdProductId && !ltdVariantId) {
    console.warn(
      '[LemonSqueezy] LEMONSQUEEZY_LTD_PRODUCT_ID / LEMONSQUEEZY_LTD_VARIANT_ID not set — granting LTD on every paid order',
    );
    return true;
  }

  const item = event.data.attributes.first_order_item;
  if (!item) {
    return false;
  }

  if (ltdVariantId && item.variant_id.toString() === ltdVariantId) {
    return true;
  }

  if (ltdProductId && item.product_id.toString() === ltdProductId) {
    return true;
  }

  return false;
}

async function handleOrderCreated(event: LemonSqueezyWebhookEvent) {
  if (!isLtdPurchase(event)) {
    return NextResponse.json({ received: true, skipped: 'not_ltd_product' });
  }

  const orderStatus = event.data.attributes.status;
  if (orderStatus && orderStatus !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'order_not_paid' });
  }

  const { email, clerkUserId } = resolveWebhookIdentity(event);
  if (!email) {
    return NextResponse.json({ error: 'Missing customer email' }, { status: 422 });
  }

  const supabase = createAdminClient();
  const eventId = buildWebhookEventId(event);
  const isNew = await markWebhookProcessed(supabase, eventId, event.meta.event_name);

  if (!isNew) {
    return NextResponse.json({ received: true, updated: false, reason: 'already_processed' });
  }

  await syncProfilePlan(supabase, {
    email,
    clerkUserId,
    planStatus: PLAN_STATUS.LTD_DIRECT,
    orderId: event.data.id,
  });

  return NextResponse.json({
    received: true,
    updated: true,
    email,
    plan_status: PLAN_STATUS.LTD_DIRECT,
  });
}

async function handleSubscriptionEvent(event: LemonSqueezyWebhookEvent) {
  const { email, clerkUserId } = resolveWebhookIdentity(event);
  if (!email) {
    return NextResponse.json({ error: 'Missing customer email' }, { status: 422 });
  }

  const attrs = event.data.attributes;
  const productId = attrs.product_id;
  const variantId = attrs.variant_id;

  if (productId == null || variantId == null) {
    return NextResponse.json({ error: 'Missing subscription product metadata' }, { status: 422 });
  }

  if (!isProSubscriptionProduct(productId, variantId)) {
    return NextResponse.json({ received: true, skipped: 'not_pro_product' });
  }

  const supabase = createAdminClient();
  const eventId = buildWebhookEventId(event);
  const isNew = await markWebhookProcessed(supabase, eventId, event.meta.event_name);

  if (!isNew) {
    return NextResponse.json({ received: true, updated: false, reason: 'already_processed' });
  }

  const eventName = event.meta.event_name;
  let planStatus: 'Pro_Monthly' | 'free' = PLAN_STATUS.FREE;

  if (eventName === 'subscription_cancelled') {
    planStatus = PLAN_STATUS.FREE;
  } else if (isActiveSubscriptionStatus(attrs.status)) {
    planStatus = PLAN_STATUS.PRO_MONTHLY;
  } else {
    planStatus = PLAN_STATUS.FREE;
  }

  await syncProfilePlan(supabase, {
    email,
    clerkUserId,
    planStatus,
    subscriptionId: event.data.id,
  });

  return NextResponse.json({
    received: true,
    updated: true,
    email,
    clerk_user_id: clerkUserId,
    plan_status: planStatus,
    subscription_status: attrs.status,
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('X-Signature');

  if (!verifyLemonSqueezyWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: LemonSqueezyWebhookEvent;
  try {
    event = JSON.parse(rawBody) as LemonSqueezyWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventName = event.meta.event_name;

  try {
    if (eventName === 'order_created') {
      return await handleOrderCreated(event);
    }

    if ((SUBSCRIPTION_EVENTS as readonly string[]).includes(eventName)) {
      return await handleSubscriptionEvent(event);
    }

    return NextResponse.json({ received: true, skipped: 'unsupported_event' });
  } catch (error) {
    console.error('[LemonSqueezy Webhook] Failed to update plan:', error);
    return NextResponse.json({ error: 'Failed to update plan status' }, { status: 500 });
  }
}
