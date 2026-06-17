'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AppSumoActivationForm = dynamic(
  () => import('@/components/appsumo/AppSumoActivationForm'),
  {
    ssr: false,
    loading: () => (
      <div className="dl-glass p-8 text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">
          Loading activation form…
        </p>
      </div>
    ),
  },
);

export default function ActivateAppSumoPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden flex flex-col min-h-screen">
      <div className="dl-grid-bg" />

      <nav className="dl-nav h-16 flex items-center justify-between px-6 md:px-10 relative shrink-0">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tighter uppercase text-zinc-100 hover:opacity-90 transition-opacity"
        >
          DropLogic<span className="text-violet-400">.</span>
        </Link>
        <button
          type="button"
          onClick={() => router.push('/dashboard/pricing')}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"
        >
          ← Back to Pricing
        </button>
      </nav>

      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 relative z-10 flex flex-col items-center justify-center">
        <div className="text-center mb-8 space-y-3">
          <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block">
            // AppSumo Lifetime Activation
          </span>
          <h1 className="dl-section-title uppercase">Redeem Your Code</h1>
          <p className="text-zinc-500 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Unlock DropLogic Lifetime Access with your AppSumo purchase code. One code per account.
          </p>
        </div>

        <div className="w-full max-w-md">
          {isClient ? <AppSumoActivationForm /> : null}
        </div>
      </main>
    </div>
  );
}
