'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/clerk-react';
import { getLtdCheckoutUrl, getProCheckoutUrl } from '@/lib/lemonsqueezy/checkout';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
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

  const redirectToCheckout = (url: string | null, label: string) => {
    if (!url) {
      console.error(`[LemonSqueezy] ${label} checkout URL is not configured`);
      return;
    }
    window.location.href = url;
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

  const proConfigured = Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_CHECKOUT_URL);
  const ltdConfigured = Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_LTD_CHECKOUT_URL);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <nav className="h-16 border-b border-black/[0.08] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 relative shrink-0">
        <DropLogicLogo href="/dashboard" size="md" className="italic" />
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest block mb-2">
            // Choose Your Plan
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Unlock DropLogic</h1>
          <p className="text-gray-400 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Start free with {FREE_TIER_VIDEO_LIMIT} AI videos, then upgrade to Pro or Lifetime when
            you are ready to scale.
          </p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free tier */}
          <div className="border border-black/[0.08] rounded-2xl p-6 bg-[#fcfcfc] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 font-mono">
                  // {freePlan.name}
                </h3>
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Starter
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight">{freePlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  {freePlan.period}
                </span>
              </div>

              <p className="text-gray-500 text-[11px] leading-relaxed mb-6 font-medium">
                {freePlan.description}
              </p>

              <div className="h-px bg-black/[0.06] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-black">
                    <span className="text-gray-400 text-[10px]">○</span>
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
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/10 bg-white text-gray-600 cursor-default"
            >
              {freePlan.cta}
            </button>
          </div>

          {/* Pro subscription */}
          <div className="border border-black/[0.08] rounded-2xl p-6 bg-white flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg relative">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 font-mono">
                  // {proPlan.name}
                </h3>
                <span className="text-[8px] font-mono font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Popular
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight">{proPlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  {proPlan.period}
                </span>
              </div>

              <p className="text-gray-500 text-[11px] leading-relaxed mb-6 font-medium">
                {proPlan.description}
              </p>

              <div className="h-px bg-black/[0.06] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {proPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-black">
                    <span className="text-blue-600 text-[10px]">⚡</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleProCheckout}
              disabled={!proConfigured}
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] bg-black text-white hover:bg-blue-600 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proConfigured ? `${proPlan.cta} →` : 'Pro Checkout Unavailable'}
            </button>
          </div>

          {/* Lifetime */}
          <div className="border border-blue-600 rounded-2xl p-6 bg-white flex flex-col justify-between transition-all duration-300 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.12)] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
              // Best Value
            </span>

            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 font-mono">
                  // {ltdPlan.name}
                </h3>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold tracking-tight">{ltdPlan.price}</span>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  {ltdPlan.period}
                </span>
              </div>

              <p className="text-gray-500 text-[11px] leading-relaxed mb-6 font-medium">
                {ltdPlan.description}
              </p>

              <div className="h-px bg-black/[0.06] w-full mb-6" />

              <ul className="space-y-3 mb-8">
                {ltdPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-xs font-medium text-black">
                    <span className="text-blue-600 text-[10px]">⚡</span>
                    <span className={feature.includes('Unlimited') ? 'font-black' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleLtdCheckout}
              disabled={!ltdConfigured}
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ltdConfigured ? `${ltdPlan.cta} →` : 'LTD Checkout Unavailable'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center max-w-lg">
          <p className="text-[10px] font-mono text-gray-400">
            🔒 Secure checkout via Lemon Squeezy. Plans sync to your account via webhook using your
            email and Clerk ID.
          </p>
        </div>
      </main>
    </div>
  );
}
