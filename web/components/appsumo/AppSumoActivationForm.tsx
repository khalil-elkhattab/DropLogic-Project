'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, useUser } from '@clerk/nextjs';
import {
  isValidAppSumoCodeFormat,
  mapAppSumoErrorMessage,
  normalizeAppSumoCode,
  redeemAppSumoCode,
} from '@/lib/appsumo';
import { notifyPlanUpdated } from '@/lib/plan-events';
import { PLAN_STATUS } from '@/lib/plan-status';
import PlanChannelBadge, { appSumoTierBadgeLabel } from '@/components/pricing/PlanChannelBadge';

type AppSumoActivationFormProps = {
  onSuccess?: () => void;
  compact?: boolean;
};

export default function AppSumoActivationForm({ onSuccess, compact = false }: AppSumoActivationFormProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redeemedTier, setRedeemedTier] = useState<string | null>(null);
  const [codesCount, setCodesCount] = useState(0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalized = normalizeAppSumoCode(code);
    if (!isValidAppSumoCodeFormat(normalized)) {
      setError('Enter a valid code in the format DROPLOGIC-AS-XXXXX.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await redeemAppSumoCode(normalized);
      setRedeemedTier(result.user_tier);
      setCodesCount(result.appsumo_codes_count);
      setSuccess(true);
      notifyPlanUpdated({
        plan_status: result.plan_status || PLAN_STATUS.LTD_APPSUMO,
        user_tier: result.user_tier,
        appsumo_codes_count: result.appsumo_codes_count,
      });
      onSuccess?.();
    } catch (activationError) {
      setError(mapAppSumoErrorMessage(activationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="dl-glass p-8 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">
          Loading account…
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={`dl-glass ${compact ? 'p-6' : 'p-8'} text-center space-y-4`}>
        <PlanChannelBadge variant="ltd_appsumo" className="mb-2" />
        <p className="text-sm text-zinc-300 font-medium">Sign in to redeem your AppSumo license key.</p>
        <SignInButton mode="modal" forceRedirectUrl="/activate-appsumo">
          <button type="button" className="dl-btn-primary h-11 px-6 text-[10px] font-black uppercase tracking-widest">
            Sign In to Redeem
          </button>
        </SignInButton>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`dl-glass ${compact ? 'p-6' : 'p-10'} text-center relative overflow-hidden`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),transparent_65%)]" />
        <div className="relative z-10 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/15 shadow-[0_0_32px_rgba(139,92,246,0.35)] animate-[pulse_2s_ease-in-out_infinite]">
            <span className="text-3xl" aria-hidden>
              🎉
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PlanChannelBadge variant="ltd_appsumo" />
            {redeemedTier && (
              <PlanChannelBadge
                variant="appsumo_tier"
                label={appSumoTierBadgeLabel(redeemedTier, codesCount)}
              />
            )}
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-50">
            AppSumo Code Redeemed
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Your account is now <span className="text-amber-200 font-bold">{PLAN_STATUS.LTD_APPSUMO}</span>.
            Stack up to 3 codes for higher monthly render limits. Head to Studio to start baking.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/studio')}
            className="dl-btn-primary h-11 px-8 text-[10px] font-black uppercase tracking-widest"
          >
            Go to Studio →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`dl-glass ${compact ? 'p-6' : 'p-8'} space-y-5`}>
      <PlanChannelBadge variant="ltd_appsumo" />

      <div className="space-y-2">
        <label htmlFor="appsumo-code" className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
          AppSumo License Key
        </label>
        <input
          id="appsumo-code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="DROPLOGIC-AS-XXXXX"
          autoComplete="off"
          spellCheck={false}
          className="w-full h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm font-mono tracking-wider text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
        <p className="text-[10px] text-zinc-500 font-medium">
          Purchased on AppSumo? Paste your license key here — not billed on this page.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !code.trim()}
        className="w-full h-11 rounded-xl dl-btn-primary text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Redeeming…' : 'Redeem AppSumo Code'}
      </button>
    </form>
  );
}
