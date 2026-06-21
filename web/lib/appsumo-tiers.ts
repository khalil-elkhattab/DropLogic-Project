/** AppSumo code-stacking tiers — keep in sync with backend/appsumo_tiers.py */

export const APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT ?? '30',
);

export const APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT ?? '100',
);

export const APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT = Number(
  process.env.NEXT_PUBLIC_APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT ?? '600',
);

export type AppSumoUserTier =
  | 'appsumo_tier1'
  | 'appsumo_tier2'
  | 'appsumo_tier3'
  | 'free';

export function tierFromAppsumoCodesCount(count: number): AppSumoUserTier | 'free' {
  if (count >= 3) return 'appsumo_tier3';
  if (count === 2) return 'appsumo_tier2';
  if (count >= 1) return 'appsumo_tier1';
  return 'free';
}

export function tierActivationMessage(userTier: string, appsumoCodesCount: number): string {
  const codeWord = appsumoCodesCount === 1 ? 'code' : 'codes';

  if (userTier === 'appsumo_tier3') {
    const limitText =
      APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT < 0
        ? 'unlimited monthly video renders'
        : `${APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT} videos per month`;
    return (
      `AppSumo ${codeWord} stacked (${appsumoCodesCount} total). ` +
      `Tier 3 unlocked — ${limitText}.`
    );
  }
  if (userTier === 'appsumo_tier2') {
    return (
      `AppSumo ${codeWord} stacked (${appsumoCodesCount} total). ` +
      `Tier 2 unlocked — ${APPSUMO_TIER2_MONTHLY_VIDEO_LIMIT} videos per month.`
    );
  }
  if (userTier === 'appsumo_tier1') {
    return (
      `AppSumo ${codeWord} stacked (${appsumoCodesCount} total). ` +
      `Tier 1 unlocked — ${APPSUMO_TIER1_MONTHLY_VIDEO_LIMIT} videos per month.`
    );
  }
  return 'AppSumo code recorded.';
}
