'use client';

import { useEffect } from 'react';
import { getAppSumoDealUrl } from '@/lib/appsumo';

export type CheckoutPlan = 'pro' | 'ltd';

type AppSumoLaunchModalProps = {
  open: boolean;
  plan: CheckoutPlan | null;
  onClose: () => void;
  onContinueCheckout: (plan: CheckoutPlan) => void;
};

export default function AppSumoLaunchModal({
  open,
  plan,
  onClose,
  onContinueCheckout,
}: AppSumoLaunchModalProps) {
  const appsumoUrl = getAppSumoDealUrl();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !plan) return null;

  const planLabel = plan === 'pro' ? 'Pro Monthly' : 'Lifetime';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appsumo-launch-title"
        className="relative z-10 w-full max-w-lg dl-glass border border-violet-500/30 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.45)] p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 text-xs font-mono"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="space-y-5 text-center">
          <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[9px] font-mono font-black uppercase tracking-widest text-violet-300">
            Limited Launch Offer
          </span>

          <h2 id="appsumo-launch-title" className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-50 leading-snug">
            🚀 Special Exclusive Launch!
          </h2>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
            Get DropLogic Lifetime Access at <span className="text-violet-300 font-black">90% OFF</span> on
            AppSumo right now!
          </p>

          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            You selected: {planLabel}
          </p>

          <div className="space-y-3 pt-2">
            {appsumoUrl ? (
              <a
                href={appsumoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full h-12 items-center justify-center rounded-xl dl-btn-primary text-[10px] font-black uppercase tracking-widest"
              >
                Get Lifetime Deal on AppSumo →
              </a>
            ) : (
              <p className="text-xs text-amber-300/90">
                AppSumo deal URL is not configured yet. Set NEXT_PUBLIC_APPSUMO_DEAL_URL in your environment.
              </p>
            )}

            <button
              type="button"
              onClick={() => onContinueCheckout(plan)}
              className="w-full text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition underline underline-offset-4"
            >
              No thanks, I prefer paying the regular monthly price
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
