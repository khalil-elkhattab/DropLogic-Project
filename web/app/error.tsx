'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import DropLogicLogo from '@/components/brand/DropLogicLogo';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[DropLogic] Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans antialiased relative overflow-hidden flex flex-col items-center justify-center px-6">
      <div
        className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="flex justify-center mb-8">
          <DropLogicLogo href="/" size="lg" className="text-white" />
        </div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" strokeWidth={1.75} />
        </div>

        <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-[0.4em] mb-3">
          // Error 500
        </p>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Something went wrong
        </h1>

        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-10">
          Our engine hit an unexpected snag. Your data is safe — try refreshing,
          or head home while we get things back online.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white/10 border border-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/15 transition active:scale-[0.98] w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-blue-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-blue-500 transition active:scale-[0.98] shadow-lg shadow-blue-600/25 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
