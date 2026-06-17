'use client';

import { useState, type FormEvent } from 'react';
import { useVideoQuota } from '@/hooks/useVideoQuota';
import { notifyQuotaUpdated } from '@/lib/plan-events';
import { shouldShowReviewBanner, submitReviewProof } from '@/lib/review-rewards';
import { getAppSumoDealUrl } from '@/lib/appsumo';

export default function ReviewUpgradeBanner() {
  const { quota, refresh } = useVideoQuota();
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!shouldShowReviewBanner(quota) && !success) {
    return null;
  }

  const appsumoUrl = getAppSumoDealUrl();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!proof.trim()) {
      setError('Enter your AppSumo username or review screenshot link.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReviewProof(proof);
      setSuccess(true);
      notifyQuotaUpdated();
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Claim failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 pt-4">
      <div className="dl-glass border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-transparent p-4 md:p-5 rounded-2xl">
        {success ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm font-bold text-emerald-300">
              ✅ Upgrade unlocked — you now have 50 videos/month forever!
            </p>
            {quota && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                {quota.used}/{quota.limit} used this {quota.period === 'monthly' ? 'month' : 'period'}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-black text-zinc-50 leading-snug">
                Want to boost your limit from{' '}
                <span className="text-amber-300">30 to 50 videos/month FREE forever</span>? Leave an
                honest review on AppSumo!
              </p>
              {appsumoUrl && (
                <a
                  href={appsumoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300 hover:text-violet-200"
                >
                  Open AppSumo to leave a review →
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-[420px]">
              <input
                type="text"
                value={proof}
                onChange={(event) => setProof(event.target.value)}
                placeholder="AppSumo username or review link"
                className="flex-1 h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-5 rounded-xl dl-btn-primary text-[10px] font-black uppercase tracking-widest whitespace-nowrap disabled:opacity-50"
              >
                {isSubmitting ? 'Claiming…' : 'Claim My Upgrade'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
