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
    <div className="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-[#ededed] font-sans antialiased relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-black/[0.05] dark:border-white/[0.08] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <DropLogicLogo href="/" size="md" />
          <div className="flex items-center gap-4 text-[12px] font-medium text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-black dark:hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black dark:hover:text-white transition">
              Terms
            </Link>
            <Link
              href="/"
              className="hidden sm:inline text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <header className="mb-10 md:mb-14 border-b border-black/[0.06] dark:border-white/[0.08] pb-8">
          <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-[0.3em] mb-3">
            // Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {lastUpdated}</p>
        </header>

        <article className="legal-content space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {children}
        </article>
      </main>

      <footer className="relative z-10 border-t border-black/[0.05] dark:border-white/[0.08] py-10 text-center">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
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
      <h2 className="text-lg md:text-xl font-bold text-black dark:text-white mb-3 tracking-tight">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
