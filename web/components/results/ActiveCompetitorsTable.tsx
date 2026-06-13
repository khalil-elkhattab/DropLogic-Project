'use client';

import { ExternalLink, Store } from 'lucide-react';
import MetricTooltip from './MetricTooltip';

export type ActiveCompetitor = {
  shop_name?: string;
  shop_url: string;
  domain?: string;
  selling_price?: number;
  price?: string;
  ad_platform?: string;
  active_ad_url?: string | null;
  spend?: string;
};

type ActiveCompetitorsTableProps = {
  competitors: ActiveCompetitor[];
  loading?: boolean;
  onInspectStore: (url: string) => void;
};

export default function ActiveCompetitorsTable({
  competitors,
  loading,
  onInspectStore,
}: ActiveCompetitorsTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden backdrop-blur-sm transition-opacity duration-700">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-900/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <MetricTooltip
              label="Active Competitors"
              tip="Live competitor storefronts mapped from ad library crawlers. Use ad links to reverse-engineer winning creatives."
            />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {loading ? 'Scanning ad libraries...' : `${competitors.length} stores tracked`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-violet-300 ring-1 ring-violet-500/20">
          Spy Mode
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-3">Store</th>
              <th className="px-6 py-3">Sell Price</th>
              <th className="px-6 py-3">Ad Platform</th>
              <th className="px-6 py-3">Spend Est.</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-zinc-200">
            {!loading && competitors.length > 0 ? (
              competitors.map((row, idx) => {
                const shopUrl = row.shop_url || (row.domain?.startsWith('http') ? row.domain : `https://${row.domain}`);
                const price =
                  row.price ?? (row.selling_price != null ? `$${row.selling_price.toFixed(2)}` : '—');
                const hasAd = Boolean(row.active_ad_url);

                return (
                  <tr
                    key={`${shopUrl}-${idx}`}
                    className="border-b border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{row.shop_name ?? row.domain}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{row.domain ?? shopUrl}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-violet-300">{price}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-300">
                        {row.ad_platform ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      <SpendBadge spend={row.spend} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onInspectStore(shopUrl)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-200 transition hover:border-white/25 hover:bg-zinc-700"
                        >
                          Store <ExternalLink className="h-3 w-3" />
                        </button>
                        {hasAd ? (
                          <a
                            href={row.active_ad_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-violet-500 shadow-[0_0_20px_-6px_rgba(139,92,246,0.8)]"
                          >
                            View Ad <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-[10px] font-mono text-zinc-600">
                            No ad link
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center font-mono text-xs text-zinc-500">
                  {loading ? 'Gathering competitor intelligence matrix...' : 'No competitors mapped yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpendBadge({ spend }: { spend?: string }) {
  const level = (spend ?? 'Medium').toLowerCase();
  const styles =
    level === 'high'
      ? 'text-red-400'
      : level === 'low'
        ? 'text-violet-400'
        : 'text-amber-400';
  return <span className={`font-bold ${styles}`}>{spend ?? 'Medium'}</span>;
}
