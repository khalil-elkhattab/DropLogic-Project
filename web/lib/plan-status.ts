/** Canonical plan_status values stored on profiles (Supabase). */

export const PLAN_STATUS = {
  FREE: 'free',
  /** $19/mo via Lemon Squeezy subscription */
  PRO_MONTHLY: 'Pro_Monthly',
  /** $49 one-time via Lemon Squeezy checkout on your site */
  LTD_DIRECT: 'LTD_Direct',
  /** License redeemed from AppSumo (stackable codes) */
  LTD_APPSUMO: 'LTD_AppSumo',
  /** @deprecated legacy — treat as Pro_Monthly */
  PRO_LEGACY: 'pro',
  /** @deprecated legacy — treat as LTD_Direct unless AppSumo tier is set */
  LTD_LEGACY: 'LTD',
  CREDITS: 'credits',
} as const;

export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

export function isPaidMonthlyPlan(planStatus: string | null | undefined): boolean {
  const plan = (planStatus || '').toLowerCase();
  return plan === 'pro_monthly' || plan === 'pro' || plan === 'credits';
}

export function isDirectLifetimePlan(planStatus: string | null | undefined): boolean {
  const plan = (planStatus || '').toLowerCase();
  return plan === 'ltd_direct' || plan === 'ltd';
}

export function isAppSumoLifetimePlan(planStatus: string | null | undefined): boolean {
  return (planStatus || '').toLowerCase() === 'ltd_appsumo';
}

export function isLifetimePlan(planStatus: string | null | undefined): boolean {
  return isDirectLifetimePlan(planStatus) || isAppSumoLifetimePlan(planStatus);
}
