'use client';

import { useRouter } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import AppSumoActivationForm from '@/components/appsumo/AppSumoActivationForm';

export default function ActivateAppSumoPage() {
  const router = useRouter();

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden flex flex-col min-h-screen">
      <div className="dl-grid-bg" />

      <nav className="dl-nav h-16 flex items-center justify-between px-6 md:px-10 relative shrink-0">
        <DropLogicLogo href="/dashboard" size="md" className="italic text-zinc-100" />
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
          <AppSumoActivationForm />
        </div>
      </main>
    </div>
  );
}
