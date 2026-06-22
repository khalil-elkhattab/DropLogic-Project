'use client';

import { PLAN_STATUS } from '@/lib/plan-status';

export type PlanBadgeVariant = 'free' | 'pro_monthly' | 'ltd_direct' | 'ltd_appsumo' | 'appsumo_tier';

const STYLES: Record<PlanBadgeVariant, string> = {
  free: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
  pro_monthly: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  ltd_direct: 'border-violet-500/40 bg-violet-500/15 text-violet-200',
  ltd_appsumo: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  appsumo_tier: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
};

const LABELS: Record<PlanBadgeVariant, string> = {
  free: 'FREE',
  pro_monthly: 'PRO_MONTHLY',
  ltd_direct: 'LTD_DIRECT',
  ltd_appsumo: 'LTD_APPSUMO',
  appsumo_tier: 'APPSUMO TIER',
};

type PlanChannelBadgeProps = {
  variant: PlanBadgeVariant;
  label?: string;
  className?: string;
};

export default function PlanChannelBadge({ variant, label, className = '' }: PlanChannelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-widest ${STYLES[variant]} ${className}`}
    >
      {label ?? LABELS[variant]}
    </span>
  );
}

export function appSumoTierBadgeLabel(userTier: string, codesCount: number): string {
  const tier = (userTier || '').toLowerCase();
  const codeWord = codesCount === 1 ? 'code' : 'codes';
  if (tier === 'appsumo_tier1') return `APPSUMO TIER 1 · ${codesCount} ${codeWord}`;
  if (tier === 'appsumo_tier2') return `APPSUMO TIER 2 · ${codesCount} ${codeWord}`;
  if (tier === 'appsumo_tier3') return `APPSUMO TIER 3 · ${codesCount} ${codeWord}`;
  return `APPSUMO · ${codesCount} ${codeWord}`;
}

export function planStatusToBadgeVariant(planStatus: string): PlanBadgeVariant {
  const plan = (planStatus || '').toLowerCase();
  if (plan === PLAN_STATUS.LTD_APPSUMO.toLowerCase()) return 'ltd_appsumo';
  if (plan === PLAN_STATUS.LTD_DIRECT.toLowerCase() || plan === 'ltd') return 'ltd_direct';
  if (plan === PLAN_STATUS.PRO_MONTHLY.toLowerCase() || plan === 'pro') return 'pro_monthly';
  return 'free';
}
