'use client';

import Link from 'next/link';
import { FREE_TIER_PAYWALL_MESSAGE } from '@/lib/quota';

type QuotaPaywallProps = {
  visible: boolean;
  used?: number;
  limit?: number;
};

export default function QuotaPaywall({ visible, used, limit }: QuotaPaywallProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-violet-600/5 p-4 shadow-[0_0_20px_rgba(139,92,246,0.12)] animate-[fadeIn_0.35s_ease-out]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-violet-300">
            // Free tier limit reached
          </p>
          <p className="text-sm font-bold text-zinc-100 leading-snug">{FREE_TIER_PAYWALL_MESSAGE}</p>
          {used != null && limit != null && (
            <p className="text-[10px] font-mono text-zinc-400">
              Usage: {used}/{limit} lifetime videos
            </p>
          )}
        </div>
        <Link
          href="/dashboard/pricing"
          className="inline-flex shrink-0 items-center justify-center h-10 px-5 rounded-lg dl-btn-primary text-[10px] uppercase tracking-widest"
        >
          View Pricing →
        </Link>
      </div>
    </div>
  );
}
