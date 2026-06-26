"use client";
import React from 'react';
import { UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import DashboardQuotaBadge from '@/components/dashboard/DashboardQuotaBadge';
import LaunchpadShowcase from '@/components/dashboard/LaunchpadShowcase';
import './launchpad-showcase.css';

export default function DashboardLaunchpad() {
  const router = useRouter();

  const handleNavigateToResults = () => {
    router.push('/dashboard/results');
  };

  const handleNavigateToStudio = () => {
    router.push('/dashboard/studio');
  };

  const handleNavigateToPricing = () => {
    router.push('/dashboard/pricing');
  };

  const handleNavigateToHistory = () => {
    router.push('/dashboard/history');
  };

  const handleNavigateToRoadmap = () => {
    router.push('/dashboard/roadmap');
  };

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden">
      <div className="dl-grid-bg" />

      <nav className="dl-nav">
        <div className="max-w-7xl mx-auto w-full h-16 flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-8">
            <DropLogicLogo href="/dashboard" size="md" className="italic text-zinc-100" />
            <div className="hidden md:flex gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              <span className="text-violet-300 border-b-2 border-violet-500 pb-1 cursor-pointer">Workspace</span>
              <span onClick={handleNavigateToPricing} className="hover:text-violet-300 cursor-pointer transition text-violet-400 font-black">Pricing</span>
              <span onClick={handleNavigateToHistory} className="hover:text-violet-300 cursor-pointer transition">Ad History</span>
              <span onClick={handleNavigateToRoadmap} className="hover:text-violet-300 cursor-pointer transition">Roadmap</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DashboardQuotaBadge />
            <div className="hidden sm:block text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              ENGINE_STABLE
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-10 md:pt-16 pb-24 px-6 md:px-10 relative z-10">
        <LaunchpadShowcase
          onExplorePatterns={handleNavigateToResults}
          onLaunchStudio={handleNavigateToStudio}
        />

        {/* Quick analysis entry */}
        <div className="relative z-10 mt-16 md:mt-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 text-center">
            Or start with a product identifier
          </p>
          <div className="dl-glass p-2 flex flex-col md:flex-row gap-2 shadow-[0_30px_60px_-15px_rgba(34,255,155,0.08)] max-w-4xl mx-auto">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Product Identifier"
                className="w-full h-14 px-6 rounded-xl dl-input font-bold text-sm tracking-tight"
              />
            </div>
            <div className="flex-[2]">
              <input
                type="text"
                placeholder="Paste Reference Link (TikTok, Shop, etc.)"
                className="w-full h-14 px-6 rounded-xl dl-input font-medium text-sm tracking-tight"
              />
            </div>
            <button
              type="button"
              onClick={handleNavigateToResults}
              className="dl-btn-primary h-14 px-10 rounded-xl text-xs uppercase tracking-[0.2em]"
            >
              Run Analysis
            </button>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] text-center">
          <p className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.3em]">
            © 2026 DropLogic
          </p>
        </div>
      </main>
    </div>
  );
}
