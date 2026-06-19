'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { getLtdCheckoutUrl, getProCheckoutUrl } from '@/lib/lemonsqueezy/checkout';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import AppSumoLaunchModal, { type CheckoutPlan } from '@/components/pricing/AppSumoLaunchModal';
import { FREE_TIER_VIDEO_LIMIT } from '@/lib/quota';

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
    'Everything you need to scale dropshipping ads — 50 HD renders per month, advanced product intelligence, and priority queue.',
  features: [
    '50 HD video renders per month',
    'Advanced product intelligence reports',
    'AI script & hashtag generation',
    'Priority render queue',
    'Cancel anytime',
  ],
  cta: 'Start Pro Subscription',
};

const ltdPlan = {
  name: 'Lifetime Deal',
  price: '$49',
  period: '/ one-time',
  description:
    'Unlimited Rendering / Lifetime Access. One payment — no recurring fees, ever.',
  features: [
    'Unlimited Rendering / Lifetime Access',
    'Unlimited product logic analysis',
    'HD video rendering — no watermarks',
    'AI script & hashtag generation',
    'All future feature updates included',
  ],
  cta: 'Get Lifetime Access',
};

export default function CustomPricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<CheckoutPlan | null>(null);

  const redirectToCheckout = (url: string | null, label: string) => {
    if (!url) {
      console.error(`[LemonSqueezy] ${label} checkout URL is not configured`);
      return;
    }
    window.location.href = url;
  };

  const openLaunchModal = (plan: CheckoutPlan) => {
    setPendingCheckoutPlan(plan);
    setLaunchModalOpen(true);
  };

  const closeLaunchModal = () => {
    setLaunchModalOpen(false);
    setPendingCheckoutPlan(null);
  };

  const handleProCheckout = () => {
    redirectToCheckout(
      getProCheckoutUrl({
        email: user?.primaryEmailAddress?.emailAddress,
        clerkUserId: user?.id,
      }),
      'Pro',
    );
  };

  const handleLtdCheckout = () => {
    redirectToCheckout(
      getLtdCheckoutUrl({
        email: user?.primaryEmailAddress?.emailAddress,
        clerkUserId: user?.id,
      }),
      'LTD',
    );
  };

  const handleContinueRegularCheckout = (plan: CheckoutPlan) => {
    closeLaunchModal();
    if (plan === 'pro') {
      handleProCheckout();
      return;
    }
    handleLtdCheckout();
  };

  const proConfigured = Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_CHECKOUT_URL);
  const ltdConfigured = Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_LTD_CHECKOUT_URL);

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
          className="mb-8 w-full max-w-2xl rounded-2xl border border-violet-500/35 bg-gradient-to-r from-violet-600/20 via-violet-500/10 to-transparent px-6 py-4 text-left transition hover:border-violet-400/50 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)]"
        >
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-300 mb-1">
            // AppSumo Customers
          </p>
          <p className="text-sm font-black uppercase tracking-wide text-zinc-50">
            Got an AppSumo Code? Click here to activate →
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Redeem your lifetime license in seconds and unlock unlimited rendering.
          </p>
        </button>

        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block mb-2">
            // Choose Your Plan
          </span>
          <h1 className="dl-section-title uppercase mb-3">Unlock DropLogic</h1>
          <p className="text-zinc-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Start free with {FREE_TIER_VIDEO_LIMIT} AI videos, then upgrade to Pro or Lifetime when
            you are ready to scale.
          </p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-3 gap-6">
          <div className="dl-glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {freePlan.name}
                </h3>
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded">
                  Starter
                </span>
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
                    <span className={feature.includes('Free AI Videos') ? 'font-black' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/studio')}
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/[0.1] bg-white/[0.04] text-zinc-400 cursor-default"
            >
              {freePlan.cta}
            </button>
          </div>

          <div className="dl-glass p-6 flex flex-col justify-between transition-all duration-300 hover:border-violet-500/30 relative">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {proPlan.name}
                </h3>
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded">
                  Popular
                </span>
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
                    <span className="text-violet-400 text-[10px]">⚡</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openLaunchModal('pro')}
              disabled={!proConfigured}
              className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proConfigured ? `${proPlan.cta} →` : 'Pro Checkout Unavailable'}
            </button>
          </div>

          <div className="dl-glass p-6 flex flex-col justify-between transition-all duration-300 border-violet-500/40 shadow-[0_30px_60px_-15px_rgba(139,92,246,0.2)] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_16px_rgba(139,92,246,0.4)]">
              // Best Value
            </span>

            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 font-mono">
                  // {ltdPlan.name}
                </h3>
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
                    <span className={feature.includes('Unlimited') ? 'font-black' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openLaunchModal('ltd')}
              disabled={!ltdConfigured}
              className="w-full h-11 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ltdConfigured ? `${ltdPlan.cta} →` : 'LTD Checkout Unavailable'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center max-w-lg">
          <p className="text-[10px] font-mono text-zinc-500">
            🔒 Secure checkout via Lemon Squeezy. Plans sync to your account via webhook using your
            email and Clerk ID.
          </p>
        </div>
      </main>

      <AppSumoLaunchModal
        open={launchModalOpen}
        plan={pendingCheckoutPlan}
        onClose={closeLaunchModal}
        onContinueCheckout={handleContinueRegularCheckout}
      />
    </div>
  );
}
