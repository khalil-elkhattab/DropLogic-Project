export const FREE_TIER_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_FREE_TIER_VIDEO_LIMIT ?? '5',
);

export const PRO_MONTHLY_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_PRO_MONTHLY_VIDEO_LIMIT ?? '50',
);

export type VideoQuota = {
  success: boolean;
  plan_status: string;
  limit: number;
  used: number;
  remaining: number;
  period: 'lifetime' | 'monthly' | string;
  allowed: boolean;
  message?: string;
  has_reviewed?: boolean;
  degraded?: boolean;
};

export function isFreeTierLimitReached(quota: VideoQuota | null): boolean {
  if (!quota) return false;
  const plan = (quota.plan_status || 'free').toLowerCase();
  if (plan !== 'free') return false;
  return !quota.allowed || quota.used >= quota.limit;
}

export const FREE_TIER_PAYWALL_MESSAGE =
  "You've reached your 5 free videos limit. Upgrade to our Lifetime plan for unlimited access!";
