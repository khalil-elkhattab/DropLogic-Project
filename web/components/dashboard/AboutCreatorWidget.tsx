'use client';

export default function AboutCreatorWidget() {
  return (
    <aside className="max-w-7xl mx-auto px-6 md:px-10 pb-10">
      <div className="dl-glass-subtle p-5 md:p-6 flex flex-col sm:flex-row gap-4 items-start">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-gradient-to-br from-violet-600/30 to-violet-900/40 text-lg font-black text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
          aria-hidden
        >
          K
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-400">
            // About the Creator
          </p>
          <h3 className="text-sm font-black uppercase tracking-wide text-zinc-100">Khalil — Solo Dev</h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Hey, I&apos;m Khalil, the solo dev behind this tool. Built this to fund my dream of moving to
            Estonia and launching my tech company. Your 5-star review isn&apos;t just a rating; it&apos;s the
            fuel that keeps me coding updates for you every day! Thank you for being part of my journey.
            🇪🇪✨
          </p>
        </div>
      </div>
    </aside>
  );
}
