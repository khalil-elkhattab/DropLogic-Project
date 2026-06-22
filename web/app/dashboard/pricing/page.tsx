'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, useUser } from '@clerk/nextjs';
import {
  getLtdCheckoutUrl,
  getProCheckoutUrl,
  isLtdCheckoutConfigured,
  isProCheckoutConfigured,
} from '@/lib/lemonsqueezy/checkout';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import PlanChannelBadge from '@/components/pricing/PlanChannelBadge';
import { FREE_TIER_VIDEO_LIMIT } from '@/lib/quota';
import { PLAN_STATUS } from '@/lib/plan-status';

const freePlan = {
  name: 'Free',
  price: '$0',
  period: '/ forever',
  description: 'Test DropLogic with full studio access — perfect for validating your first winning products.',
  features: [
    `${FREE_TIER_VIDEO_LIMIT} Free AI Videos`,
    'Product intelligence reports',
    'AI script generation',
    'Standard render queue',
    'Watermarked exports',
  ],
  cta: 'Current Plan',
};

const proPlan = {
  name: 'Pro Monthly',
  price: '$19',
  period: '/ month',
  description:
    'Everything you need to scale dropshipping ads — HD renders per month, advanced product intelligence, and priority queue.',
  features: [
    '200 HD video renders per month',
    'Advanced product intelligence reports',
    'AI script & hashtag generation',
    'Priority render queue',
    'Cancel anytime via Lemon Squeezy',
  ],
  cta: 'Start Pro — $19/mo',
};

const ltdPlan = {
  name: 'Lifetime Direct',
  price: '$49',
  period: '/ one-time',
  description: 'Buy once on our site via Lemon Squeezy. Premium lifetime access — no AppSumo code required.',
  features: [
    'Premium lifetime access',
    'Unlimited product logic analysis',
    'HD video rendering — no watermarks',
    'AI script & hashtag generation',
    'All future feature updates included',
  ],
  cta: 'Get Lifetime — $49',
};

export default function CustomPricingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const checkoutIdentity = useMemo(
    () => ({
      email: user?.primaryEmailAddress?.emailAddress,
      clerkUserId: user?.id,
    }),
    [user?.id, user?.primaryEmailAddress?.emailAddress],
  );

  const proCheckoutUrl = useMemo(
    () => (isProCheckoutConfigured() ? getProCheckoutUrl(checkoutIdentity) : null),
    [checkoutIdentity],
  );

  const ltdCheckoutUrl = useMemo(
    () => (isLtdCheckoutConfigured() ? getLtdCheckoutUrl(checkoutIdentity) : null),
    [checkoutIdentity],
  );

  const redirectToCheckout = (url: string | null, label: string) => {
    if (!isSignedIn) {
      return;
    }
    if (!url) {
      console.error(`[LemonSqueezy] ${label} checkout URL is not configured`);
      window.alert(
        `${label} checkout is not configured yet. Set NEXT_PUBLIC_LEMONSQUEEZY_${label === 'Pro' ? 'PRO' : 'LTD'}_CHECKOUT_URL in Vercel.`,
      );
      return;
    }
    window.location.href = url;
  };

  const proReady = Boolean(proCheckoutUrl);
  const ltdReady = Boolean(ltdCheckoutUrl);

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden flex flex-col">
      <div className="dl-grid-bg" />

      <nav className="dl-nav h-16 flex items-center justify-between px-6 md:px-10 relative shrink-0">
        <DropLogicLogo href="/dashboard" size="md" className="italic text-zinc-100" />
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        <button
          type="button"
          onClick={() => router.push('/activate-appsumo')}
          className="mb-8 w-full max-w-2xl rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-600/15 via-amber-500/10 to-transparent px-6 py-4 text-left transition hover:border-amber-400/50 hover:shadow-[0_0_28px_rgba(245,158,11,0.15)]"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PlanChannelBadge variant="ltd_appsumo" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              Bought on AppSumo? Redeem here — not Lemon checkout
            </span>
          </div>
          <p className="text-sm font-black uppercase tracking-wide text-zinc-50">
            Got an AppSumo Code? Click here to redeem →
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Stack up to 3 codes for Tier 1 / 2 / 3 monthly render limits.
          </p>
        </button>

        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block mb-2">
            // Choose Your Channel
          </span>
          <h1 className="dl-section-title uppercase mb-3">Unlock DropLogic</h1>
          <p className="text-zinc-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Three ways to upgrade: stay <span className="text-zinc-300">FREE</span>, subscribe{' '}
            <span className="text-sky-300">Pro_Monthly</span> via Lemon, or buy{' '}
            <span className="text-violet-300">LTD_Direct</span> once on our site.
          </p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE */}
          <div className="dl-glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {freePlan.name}
                </h3>
                <PlanChannelBadge variant="free" label={PLAN_STATUS.FREE.toUpperCase()} />
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight text-zinc-50">{freePlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  {freePlan.period}
                </span>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed mb-6 font-medium">
                {freePlan.description}
              </p>

              <div className="h-px bg-white/[0.08] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                    <span className="text-zinc-500 text-[10px]">○</span>
                    <span className={feature.includes('Free AI Videos') ? 'font-black' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/studio')}
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/[0.1] bg-white/[0.04] text-zinc-400"
            >
              {freePlan.cta}
            </button>
          </div>

          {/* PRO MONTHLY */}
          <div className="dl-glass p-6 flex flex-col justify-between transition-all duration-300 hover:border-sky-500/30 relative">
            <div>
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {proPlan.name}
                </h3>
                <PlanChannelBadge variant="pro_monthly" label={PLAN_STATUS.PRO_MONTHLY} />
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight text-zinc-50">{proPlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  {proPlan.period}
                </span>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed mb-6 font-medium">
                {proPlan.description}
              </p>

              <div className="h-px bg-white/[0.08] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {proPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                    <span className="text-sky-400 text-[10px]">⚡</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isLoaded && isSignedIn ? (
              <button
                type="button"
                onClick={() => redirectToCheckout(proCheckoutUrl, 'Pro')}
                className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest border border-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.12)]"
              >
                {proReady ? `${proPlan.cta} →` : 'Configure Pro Checkout URL'}
              </button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/dashboard/pricing">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest"
                >
                  Sign In to Subscribe →
                </button>
              </SignInButton>
            )}
            <p className="text-[9px] font-mono text-zinc-600 text-center mt-2 uppercase tracking-wider">
              Lemon Squeezy · Webhook → {PLAN_STATUS.PRO_MONTHLY}
            </p>
          </div>

          {/* LTD DIRECT */}
          <div className="dl-glass p-6 flex flex-col justify-between transition-all duration-300 border-violet-500/40 shadow-[0_30px_60px_-15px_rgba(139,92,246,0.2)] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_16px_rgba(139,92,246,0.4)]">
              // Best Value
            </span>

            <div>
              <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {ltdPlan.name}
                </h3>
                <PlanChannelBadge variant="ltd_direct" label={PLAN_STATUS.LTD_DIRECT} />
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight text-zinc-50">{ltdPlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  {ltdPlan.period}
                </span>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed mb-6 font-medium">
                {ltdPlan.description}
              </p>

              <div className="h-px bg-white/[0.08] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {ltdPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                    <span className="text-violet-400 text-[10px]">⚡</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {isLoaded && isSignedIn ? (
              <button
                type="button"
                onClick={() => redirectToCheckout(ltdCheckoutUrl, 'LTD')}
                className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest"
              >
                {ltdReady ? `${ltdPlan.cta} →` : 'Configure LTD Checkout URL'}
              </button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/dashboard/pricing">
                <button
                  type="button"
                  className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest"
                >
                  Sign In to Buy Lifetime →
                </button>
              </SignInButton>
            )}
            <p className="text-[9px] font-mono text-zinc-600 text-center mt-2 uppercase tracking-wider">
              Lemon Squeezy · Webhook → {PLAN_STATUS.LTD_DIRECT}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center max-w-lg space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            <PlanChannelBadge variant="free" />
            <PlanChannelBadge variant="pro_monthly" />
            <PlanChannelBadge variant="ltd_direct" />
            <PlanChannelBadge variant="ltd_appsumo" />
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            🔒 Lemon checkout syncs via webhook using your email + Clerk ID. AppSumo users redeem at{' '}
            <button
              type="button"
              onClick={() => router.push('/activate-appsumo')}
              className="text-amber-300/90 underline underline-offset-2 hover:text-amber-200"
            >
              /activate-appsumo
            </button>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
