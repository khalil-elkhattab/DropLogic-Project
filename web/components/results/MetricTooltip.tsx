'use client';

import React from 'react';

type MetricTooltipProps = {
  label: string;
  tip: string;
  children?: React.ReactNode;
};

export default function MetricTooltip({ label, tip, children }: MetricTooltipProps) {
  return (
    <div className="group relative inline-flex items-center gap-1.5">
      {children ?? (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </span>
      )}
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-600/80 bg-zinc-800/80 text-[9px] font-bold text-zinc-300 cursor-help"
        aria-label={tip}
      >
        ?
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-emerald-500/20 bg-zinc-900/95 p-3 text-[11px] leading-snug text-zinc-300 opacity-0 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
      >
        {tip}
      </div>
    </div>
  );
}
