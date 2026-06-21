export const FREE_TIER_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_FREE_TIER_VIDEO_LIMIT ?? '5',
);

export const PREMIUM_MONTHLY_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_VIDEO_LIMIT ?? '200',
);

export {
  APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT,
  APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT,
  APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT,
} from './appsumo-tiers';

export type UserTier =
  | 'free'
  | 'premium'
  | 'appsumo_tier1'
  | 'appsumo_tier2'
  | 'appsumo_tier3';

export type VideoQuota = {
  success: boolean;
  plan_status: string;
  user_tier?: UserTier | string;
  appsumo_codes_count?: number;
  limit: number;
  used: number;
  remaining: number;
  period: 'lifetime' | 'monthly' | 'unlimited' | string;
  allowed: boolean;
  message?: string;
  has_reviewed?: boolean;
  degraded?: boolean;
};

export function isFreeTierLimitReached(quota: VideoQuota | null): boolean {
  if (!quota) return false;
  const tier = (quota.user_tier || quota.plan_status || 'free').toLowerCase();
  if (tier !== 'free') return false;
  return !quota.allowed || quota.used >= quota.limit;
}

export const FREE_TIER_PAYWALL_MESSAGE =
  "You've reached your 5 free videos limit. Upgrade to Premium or stack AppSumo codes for more renders!";
