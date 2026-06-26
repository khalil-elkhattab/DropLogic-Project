'use client';

import React, { useEffect, useState } from 'react';
import { Play, Zap, Mic, Film, ArrowRight, Sparkles } from 'lucide-react';

function useCountUp(target: number, durationMs = 2200, enabled = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, enabled]);

  return value;
}

const PREVIEW_CARDS = [
  {
    title: 'Neo Projector',
    score: 9.8,
    cat: 'Optics',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #064e3b 70%, #312e81 100%)',
  },
  {
    title: 'Gravity Mat',
    score: 8.4,
    cat: 'Health',
    gradient: 'linear-gradient(135deg, #18181b 0%, #3b0764 40%, #14532d 75%, #1e3a5f 100%)',
  },
  {
    title: 'Soniq Brush',
    score: 9.2,
    cat: 'Beauty',
    gradient: 'linear-gradient(135deg, #0c0a09 0%, #4c1d95 30%, #134e4a 65%, #831843 100%)',
  },
  {
    title: 'Aura Frame',
    score: 7.9,
    cat: 'Decor',
    gradient: 'linear-gradient(135deg, #09090b 0%, #312e81 35%, #065f46 70%, #581c87 100%)',
  },
] as const;

const FLOW_STEPS = [
  {
    step: '01',
    icon: Film,
    title: 'Fetch Video',
    desc: 'Scrape winning TikTok assets and cache high-performing reference clips from live market feeds.',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    step: '02',
    icon: Mic,
    title: 'Natural Voiceover',
    desc: 'Generate 100% human-speed AI speech with hook, body, and CTA — no chipmunk tempo, no rushed delivery.',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Super-Fast Bake',
    desc: 'FFmpeg ultra-speed rendering loops your clip to voice length and exports a vertical ad in under 60 seconds.',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
] as const;

type LaunchpadShowcaseProps = {
  onExplorePatterns: () => void;
  onLaunchStudio: () => void;
};

export default function LaunchpadShowcase({
  onExplorePatterns,
  onLaunchStudio,
}: LaunchpadShowcaseProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const avgLogic = useCountUp(9.1, 2400, mounted);
  const rendersToday = useCountUp(1284, 2600, mounted);
  const usagePct = useCountUp(64, 2000, mounted);
  const engineMs = useCountUp(47, 1800, mounted);

  return (
    <section className="dl-launchpad relative">
      <div className="dl-launchpad-hero-glow" aria-hidden />
      <div className="dl-launchpad-matrix-lines rounded-3xl" aria-hidden />

      {/* Hero copy */}
      <header className="relative z-10 mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 dl-badge mb-6 border border-emerald-500/20 bg-emerald-500/5">
          <span className="dl-launchpad-live-dot" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
            Neural Engine Online
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[0.95] text-zinc-50 mb-5">
          Save Your Time.{' '}
          <span className="block mt-1 bg-gradient-to-r from-emerald-300 via-cyan-200 to-violet-400 bg-clip-text text-transparent">
            Get Winning Ads Instantly.
          </span>
        </h1>

        <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl leading-relaxed tracking-tight">
          Stop wasting hours on manual editing. Let our neural engine bake high-converting creatives in
          under 60 seconds.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLaunchStudio}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-xs font-bold uppercase tracking-[0.18em] text-zinc-950 bg-gradient-to-r from-emerald-300 to-cyan-300 hover:from-emerald-200 hover:to-cyan-200 transition-all shadow-[0_0_32px_rgba(34,255,155,0.2)]"
          >
            <Sparkles className="w-4 h-4" />
            Launch Studio
          </button>
          <button
            type="button"
            onClick={onExplorePatterns}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-xs font-bold uppercase tracking-[0.18em] border border-violet-500/30 text-violet-200 bg-violet-500/5 hover:bg-violet-500/10 transition-all"
          >
            Run Analysis
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="dl-launchpad-line mb-10" />

      {/* Live system stats */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-12 md:mb-16">
        {[
          {
            label: 'Avg Logic Score',
            value: avgLogic.toFixed(1),
            suffix: '/10',
            pill: 'dl-launchpad-stat-pill',
            valueClass: 'text-emerald-300',
          },
          {
            label: 'Renders Today',
            value: Math.round(rendersToday).toLocaleString(),
            suffix: '',
            pill: 'dl-launchpad-stat-pill dl-launchpad-stat-pill--violet',
            valueClass: 'text-violet-300',
          },
          {
            label: 'Engine Latency',
            value: Math.round(engineMs).toString(),
            suffix: 'ms',
            pill: 'dl-launchpad-stat-pill',
            valueClass: 'text-cyan-300',
          },
          {
            label: 'Queue Usage',
            value: Math.round(usagePct).toString(),
            suffix: '%',
            pill: 'dl-launchpad-stat-pill dl-launchpad-stat-pill--violet',
            valueClass: 'text-violet-300',
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.pill} rounded-2xl px-4 py-4 md:px-5 md:py-5`}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
              {stat.label}
            </p>
            <p className={`font-mono text-2xl md:text-3xl font-black tabular-nums ${stat.valueClass}`}>
              {stat.value}
              <span className="text-sm font-bold text-zinc-500 ml-0.5">{stat.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Neural preview cards */}
      <div className="relative z-10 mb-14 md:mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6 mb-8">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.35em] text-zinc-100">
              Curated Winning Patterns
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
              <span className="dl-launchpad-live-dot" />
              Live neural previews — updated every 60s
            </p>
          </div>
          <button
            type="button"
            onClick={onExplorePatterns}
            className="text-[10px] font-bold text-emerald-400 flex items-center gap-2 hover:tracking-[0.15em] transition-all self-start sm:self-auto"
          >
            VIEW ALL LOGIC
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {PREVIEW_CARDS.map((ad, i) => (
            <button
              key={ad.title}
              type="button"
              onClick={onExplorePatterns}
              className="group text-left w-full"
            >
              <div className="dl-launchpad-preview-card">
                <div
                  className="dl-launchpad-preview-bg"
                  style={{ backgroundImage: ad.gradient }}
                />
                <div className="dl-launchpad-scanline" />
                <div className="dl-launchpad-skeleton-shimmer" />

                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="dl-launchpad-play-btn flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Play className="w-5 h-5 text-emerald-300 fill-emerald-300/20 ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-5 left-5 z-20">
                  <div className="bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/30 text-emerald-300 text-[9px] font-black px-2.5 py-1 rounded-md tracking-tight uppercase font-mono shadow-[0_0_16px_rgba(34,255,155,0.15)]">
                    Logic_{mounted ? ad.score.toFixed(1) : '0.0'}
                  </div>
                </div>

                <div className="absolute top-5 right-5 z-20">
                  <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-[0.4em] group-hover:text-violet-300 transition-colors">
                    Neural_{String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="absolute bottom-0 inset-x-0 z-20 p-5 pt-16 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1">
                    {ad.cat}
                  </p>
                  <h3 className="text-base font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                    {ad.title}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* What we do flow */}
      <div className="relative z-10 mb-16 md:mb-20">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-400 mb-3">
            What We Do
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-50">
            Proprietary Neural Bake Pipeline
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-lg mx-auto">
            From scraped viral asset to export-ready TikTok ad — fully automated, conversion-optimized.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
          {FLOW_STEPS.map((item, index) => (
            <React.Fragment key={item.step}>
              <div className={`dl-launchpad-flow-step ${item.border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`font-mono text-xs font-black ${item.accent}`}>{item.step}</span>
                  <div className={`p-2 rounded-lg bg-white/[0.04] border ${item.border}`}>
                    <item.icon className={`w-4 h-4 ${item.accent}`} />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
              {index < FLOW_STEPS.length - 1 && (
                <div className="dl-launchpad-flow-connector" aria-hidden>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="relative z-10 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap gap-6 md:gap-10 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.25em]">
          <span className="text-zinc-400">Neural Network: Active</span>
          <span className="hidden sm:inline text-emerald-500/80">Cluster: EU_West_1</span>
          <span className="hidden sm:inline">Pipeline: FFmpeg Ultra</span>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto max-w-xs">
          <div className="dl-launchpad-usage-bar flex-1 md:w-28">
            <div
              className="dl-launchpad-usage-fill"
              style={{ width: mounted ? `${Math.round(usagePct)}%` : '0%' }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase whitespace-nowrap tabular-nums">
            Usage: {Math.round(usagePct)}%
          </span>
        </div>
      </div>
    </section>
  );
}
