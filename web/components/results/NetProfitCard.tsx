'use client';

import MetricTooltip from './MetricTooltip';

export type ProductFinancials = {
  units_sold: number;
  selling_price: number;
  supplier_cost_per_unit: number;
  revenue: number;
  revenue_display: string;
  cogs: number;
  cogs_display: string;
  estimated_ad_spend: number;
  estimated_ad_spend_display: string;
  ad_spend_rate: number;
  net_profit: number;
  net_profit_display: string;
  net_profit_margin_pct: number;
  margin_trend?: string;
  formula?: string;
};

type NetProfitCardProps = {
  financials: ProductFinancials | null;
  loading?: boolean;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-800/80 ${className ?? ''}`} />;
}

export default function NetProfitCard({ financials, loading }: NetProfitCardProps) {
  if (loading || !financials) {
    return (
      <div className="col-span-full rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <Skeleton className="mb-4 h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const marginHealthy = financials.net_profit_margin_pct >= 15;

  return (
    <div className="col-span-full rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 p-6 shadow-[0_0_40px_-12px_rgba(52,211,153,0.45)] transition-all duration-500">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <MetricTooltip
          label="Net Profit Margin Calculator"
          tip="We estimate dropshipper take-home after COGS (supplier cost × units) and a conservative 30% ad spend allocation on revenue."
        />
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
            marginHealthy
              ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.55)] ring-1 ring-emerald-400/50'
              : 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          {financials.net_profit_margin_pct.toFixed(1)}% Net Margin
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightStat
          label="Units Sold (Est.)"
          value={financials.units_sold.toLocaleString()}
          tip="Modeled monthly order volume from market signals and competitor velocity."
        />
        <InsightStat
          label="Revenue"
          value={financials.revenue_display}
          tip="Revenue = units sold × average selling price across tracked stores."
        />
        <InsightStat
          label="COGS"
          value={financials.cogs_display}
          tip="Cost of Goods Sold = supplier cost per unit × units sold."
          sub={`@ $${financials.supplier_cost_per_unit.toFixed(2)}/unit`}
        />
        <InsightStat
          label="Est. Ad Spend (30%)"
          value={financials.estimated_ad_spend_display}
          tip="We reserve 30% of revenue for TikTok/Meta acquisition — typical for scaling dropship stores."
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] text-zinc-500">
          {financials.formula ?? 'Net Profit = Revenue - COGS - Est. Ad Spend (30%)'}
        </p>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Net Profit</p>
          <p className="text-3xl font-black tracking-tight text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
            {financials.net_profit_display}
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightStat({
  label,
  value,
  tip,
  sub,
}: {
  label: string;
  value: string;
  tip: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-4 transition hover:border-emerald-500/20 hover:bg-black/40">
      <MetricTooltip label={label} tip={tip} />
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-[10px] font-mono text-zinc-500">{sub}</p>}
    </div>
  );
}
