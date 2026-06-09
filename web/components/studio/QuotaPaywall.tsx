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
      className="rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm animate-[fadeIn_0.35s_ease-out]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-amber-700">
            // Free tier limit reached
          </p>
          <p className="text-sm font-bold text-amber-950 leading-snug">{FREE_TIER_PAYWALL_MESSAGE}</p>
          {used != null && limit != null && (
            <p className="text-[10px] font-mono text-amber-800/70">
              Usage: {used}/{limit} lifetime videos
            </p>
          )}
        </div>
        <Link
          href="/dashboard/pricing"
          className="inline-flex shrink-0 items-center justify-center h-10 px-5 rounded-lg bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-md"
        >
          View Pricing →
        </Link>
      </div>
    </div>
  );
}
