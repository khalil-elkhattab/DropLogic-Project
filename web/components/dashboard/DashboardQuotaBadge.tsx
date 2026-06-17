'use client';

import { useVideoQuota } from '@/hooks/useVideoQuota';

export default function DashboardQuotaBadge() {
  const { quota, loading } = useVideoQuota();

  if (loading || !quota) {
    return (
      <div className="text-[9px] font-mono font-bold text-zinc-500 bg-white/[0.04] px-2.5 py-1 rounded border border-white/10 tracking-wider uppercase">
        Quota…
      </div>
    );
  }

  const reviewed = quota.has_reviewed ? ' · Reviewed ✓' : '';
  const label =
    quota.period === 'monthly'
      ? `${quota.remaining}/${quota.limit} videos/mo${reviewed}`
      : `${quota.remaining}/${quota.limit} videos${reviewed}`;

  return (
    <div className="text-[9px] font-mono font-bold text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded border border-violet-500/25 tracking-wider uppercase max-w-[200px] truncate">
      {label}
    </div>
  );
}
