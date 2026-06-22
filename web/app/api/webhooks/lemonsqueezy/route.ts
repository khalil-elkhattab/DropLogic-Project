import { NextRequest, NextResponse } from 'next/server';
import { verifyLemonSqueezyWebhook } from '@/lib/lemonsqueezy/verify-webhook';
import type { LemonSqueezyWebhookEvent } from '@/lib/lemonsqueezy/types';
import {
  ORDER_EVENTS,
  SUBSCRIPTION_EVENTS,
  SUBSCRIPTION_INVOICE_EVENTS,
} from '@/lib/lemonsqueezy/types';
import {
  buildWebhookEventId,
  hasWebhookBeenProcessed,
  isActiveSubscriptionStatus,
  isLtdProduct,
  isProSubscriptionProduct,
  markWebhookProcessed,
  resolveWebhookIdentity,
  syncProfilePlan,
} from '@/lib/lemonsqueezy/profile-sync';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_STATUS } from '@/lib/plan-status';

export const runtime = 'nodejs';

type PlanStatusTarget = typeof PLAN_STATUS.PRO_MONTHLY | typeof PLAN_STATUS.LTD_DIRECT;

function getOrderItemProductIds(event: LemonSqueezyWebhookEvent) {
  const item = event.data.attributes.first_order_item;
  if (!item) {
    return null;
  }
  return {
    productId: item.product_id,
    variantId: item.variant_id,
  };
}

function resolvePaidOrderPlan(event: LemonSqueezyWebhookEvent): PlanStatusTarget | null {
  const ids = getOrderItemProductIds(event);
  if (!ids) {
    return null;
  }

  if (isLtdProduct(ids.productId, ids.variantId)) {
    return PLAN_STATUS.LTD_DIRECT;
  }

  if (isProSubscriptionProduct(ids.productId, ids.variantId)) {
    return PLAN_STATUS.PRO_MONTHLY;
  }

  return null;
}

async function applyPlanUpdate(
  event: LemonSqueezyWebhookEvent,
  planStatus: PlanStatusTarget | typeof PLAN_STATUS.FREE,
  options: { subscriptionId?: string; orderId?: string } = {},
) {
  const { email, clerkUserId } = resolveWebhookIdentity(event);
  if (!email && !clerkUserId) {
    return NextResponse.json(
      { error: 'Missing customer email and clerk_user_id' },
      { status: 422 },
    );
  }

  if (!email) {
    return NextResponse.json({ error: 'Missing customer email' }, { status: 422 });
  }

  const supabase = createAdminClient();
  const eventId = buildWebhookEventId(event);

  if (await hasWebhookBeenProcessed(supabase, eventId)) {
    return NextResponse.json({ received: true, updated: false, reason: 'already_processed' });
  }

  await syncProfilePlan(supabase, {
    email,
    clerkUserId,
    planStatus,
    subscriptionId: options.subscriptionId,
    orderId: options.orderId,
  });

  await markWebhookProcessed(supabase, eventId, event.meta.event_name);

  return NextResponse.json({
    received: true,
    updated: true,
    email,
    clerk_user_id: clerkUserId,
    plan_status: planStatus,
    event: event.meta.event_name,
  });
}

async function handleOrderCreated(event: LemonSqueezyWebhookEvent) {
  const orderStatus = event.data.attributes.status;
  if (orderStatus && orderStatus !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'order_not_paid' });
  }

  const planStatus = resolvePaidOrderPlan(event);
  if (!planStatus) {
    const ids = getOrderItemProductIds(event);
    console.warn('[LemonSqueezy] order_created skipped — product not configured', {
      product_id: ids?.productId ?? null,
      variant_id: ids?.variantId ?? null,
    });
    return NextResponse.json({ received: true, skipped: 'unrecognized_product' });
  }

  return applyPlanUpdate(event, planStatus, { orderId: event.data.id });
}

async function handleSubscriptionEvent(event: LemonSqueezyWebhookEvent) {
  const attrs = event.data.attributes;
  const productId = attrs.product_id;
  const variantId = attrs.variant_id;

  if (productId == null || variantId == null) {
    return NextResponse.json({ error: 'Missing subscription product metadata' }, { status: 422 });
  }

  if (!isProSubscriptionProduct(productId, variantId)) {
    console.warn('[LemonSqueezy] subscription event skipped — not pro product', {
      event: event.meta.event_name,
      product_id: productId,
      variant_id: variantId,
    });
    return NextResponse.json({ received: true, skipped: 'not_pro_product' });
  }

  const eventName = event.meta.event_name;
  let planStatus: typeof PLAN_STATUS.PRO_MONTHLY | typeof PLAN_STATUS.FREE = PLAN_STATUS.FREE;

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    planStatus = PLAN_STATUS.FREE;
  } else if (isActiveSubscriptionStatus(attrs.status)) {
    planStatus = PLAN_STATUS.PRO_MONTHLY;
  } else {
    planStatus = PLAN_STATUS.FREE;
  }

  return applyPlanUpdate(event, planStatus, { subscriptionId: event.data.id });
}

async function handleSubscriptionInvoiceEvent(event: LemonSqueezyWebhookEvent) {
  const attrs = event.data.attributes;
  const invoiceStatus = attrs.status;
  const billingReason = attrs.billing_reason;

  if (invoiceStatus && invoiceStatus !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'invoice_not_paid' });
  }

  if (billingReason && billingReason !== 'initial' && billingReason !== 'renewal') {
    return NextResponse.json({ received: true, skipped: 'invoice_billing_reason' });
  }

  const subscriptionId = attrs.subscription_id;
  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscription_id on invoice' }, { status: 422 });
  }

  const { email, clerkUserId } = resolveWebhookIdentity(event);
  if (!email) {
    return NextResponse.json({ error: 'Missing customer email' }, { status: 422 });
  }

  const supabase = createAdminClient();

  if (clerkUserId) {
    const existing = await supabase
      .from('profiles')
      .select('id, plan_status')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      return applyPlanUpdate(event, PLAN_STATUS.PRO_MONTHLY, {
        subscriptionId: String(subscriptionId),
      });
    }
  }

  const bySubscription = await supabase
    .from('profiles')
    .select('id')
    .eq('lemon_squeezy_subscription_id', String(subscriptionId))
    .maybeSingle();

  if (bySubscription.error) {
    throw bySubscription.error;
  }

  if (!bySubscription.data) {
    console.warn('[LemonSqueezy] subscription invoice skipped — no linked profile', {
      subscription_id: subscriptionId,
      email,
    });
    return NextResponse.json({ received: true, skipped: 'profile_not_linked' });
  }

  return applyPlanUpdate(event, PLAN_STATUS.PRO_MONTHLY, {
    subscriptionId: String(subscriptionId),
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
    console.warn('[LemonSqueezy] Invalid webhook signature');
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
    if ((ORDER_EVENTS as readonly string[]).includes(eventName)) {
      return await handleOrderCreated(event);
    }

    if ((SUBSCRIPTION_EVENTS as readonly string[]).includes(eventName)) {
      return await handleSubscriptionEvent(event);
    }

    if ((SUBSCRIPTION_INVOICE_EVENTS as readonly string[]).includes(eventName)) {
      return await handleSubscriptionInvoiceEvent(event);
    }

    return NextResponse.json({ received: true, skipped: 'unsupported_event' });
  } catch (error) {
    console.error('[LemonSqueezy Webhook] Failed to update plan:', error);
    return NextResponse.json({ error: 'Failed to update plan status' }, { status: 500 });
  }
}
