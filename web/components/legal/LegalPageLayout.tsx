import Link from 'next/link';
import type { ReactNode } from 'react';
import DropLogicLogo from '@/components/brand/DropLogicLogo';

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden">
      <div className="dl-grid-bg" />

      <nav className="dl-nav">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <DropLogicLogo href="/" size="md" className="text-zinc-100" />
          <div className="flex items-center gap-4 text-[12px] font-medium text-zinc-500">
            <Link href="/privacy" className="hover:text-violet-300 transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-violet-300 transition">
              Terms
            </Link>
            <Link
              href="/"
              className="hidden sm:inline text-zinc-200 hover:text-violet-300 transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <header className="mb-10 md:mb-14 border-b border-white/[0.08] pb-8">
          <p className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-[0.3em] mb-3">
            // Legal
          </p>
          <h1 className="dl-section-title mb-3">{title}</h1>
          <p className="text-sm text-zinc-500">Last updated: {lastUpdated}</p>
        </header>

        <article className="legal-content space-y-8 text-[15px] leading-relaxed text-zinc-400">
          {children}
        </article>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] py-10 text-center">
        <p className="text-[11px] text-zinc-600 font-mono">
          © {new Date().getFullYear()} DropLogic. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg md:text-xl font-bold text-zinc-100 mb-3 tracking-tight">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
