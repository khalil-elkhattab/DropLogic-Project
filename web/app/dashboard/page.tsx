"use client";
import React from 'react';
import { UserButton } from "@clerk/clerk-react";
import { useRouter } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';

export default function DashboardLaunchpad() {
  const router = useRouter();

  // دالة موحدة للذهاب إلى صفحة النتائج الحقيقية
  const handleNavigateToResults = () => {
    router.push('/dashboard/results');
  };

  // دالة للذهاب إلى صفحة الأسعار المربوطة بـ Clerk Billing
  const handleNavigateToPricing = () => {
    router.push('/dashboard/pricing');
  };

  const handleNavigateToHistory = () => {
    router.push('/dashboard/history');
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
            <span onClick={handleNavigateToPricing} className="hover:text-violet-300 cursor-pointer transition text-violet-400 font-black">⚡ Pricing</span>
            <span onClick={handleNavigateToHistory} className="hover:text-violet-300 cursor-pointer transition">Ad History</span>
            <span className="hover:text-violet-300 cursor-pointer transition">Neural_Feed</span>
            <span className="hover:text-violet-300 cursor-pointer transition">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div 
            onClick={handleNavigateToPricing}
            className="text-[9px] font-mono font-bold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded border border-violet-500/25 cursor-pointer transition tracking-wider uppercase"
          >
            Credits: <span className="font-black">3 Left</span> 🔒
          </div>
          <div className="hidden sm:block text-[9px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
            ENGINE_STABLE_200ms
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-16 md:pt-24 pb-24 px-6 md:px-10 relative z-10">
        
        {/* SECTION 1: THE HEADER (High Contrast & Tighter Typography) */}
        <div className="mb-20">
          <header className="mb-12">
            <div className="dl-badge mb-6">
              Core Processor v2.0
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.05em] leading-[0.85] text-zinc-50 mb-8">
              System <br /> 
              <span className="text-zinc-500 italic">Intelligence.</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl tracking-tight leading-snug">
              Identify market gaps and validate product logic using our proprietary neural engine.
            </p>
          </header>
          
          {/* Inputs: Advanced but simple */}
          <div className="dl-glass p-2 flex flex-col md:flex-row gap-2 shadow-[0_30px_60px_-15px_rgba(139,92,246,0.12)]">
            <div className="flex-[1]">
              <input 
                type="text" 
                placeholder="Product Identifier" 
                className="w-full h-16 px-8 rounded-xl dl-input font-bold text-sm tracking-tight"
              />
            </div>
            <div className="flex-[2]">
              <input 
                type="text" 
                placeholder="Paste Reference Link (TikTok, Shop, etc.)" 
                className="w-full h-16 px-8 rounded-xl dl-input font-medium text-sm tracking-tight"
              />
            </div>
            <button 
              onClick={handleNavigateToResults}
              className="dl-btn-primary h-16 px-12 rounded-xl text-xs uppercase tracking-[0.2em]"
            >
              Run Analysis
            </button>
          </div>
        </div>

        {/* SECTION 2: THE CARDS (Minimalist & High-End) */}
        <div className="space-y-12">
          <div className="flex items-end justify-between border-b border-white/[0.08] pb-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-100">Curated Patterns</h2>
              <p className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest italic">Updated every 60 seconds</p>
            </div>
            <div 
              onClick={handleNavigateToResults} 
              className="text-[10px] font-bold text-violet-400 flex items-center gap-2 cursor-pointer hover:tracking-[0.2em] transition-all"
            >
              VIEW ALL LOGIC →
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Neo Projector", score: "9.8", cat: "Optics" },
              { title: "Gravity Mat", score: "8.4", cat: "Health" },
              { title: "Soniq Brush", score: "9.2", cat: "Beauty" },
              { title: "Aura Frame", score: "7.9", cat: "Decor" }
            ].map((ad, i) => (
              /* إضافة حدث onClick على الكارت بالكامل للذهاب لصفحة النتائج الحقيقية عند اختياره */
              <div 
                key={i} 
                onClick={handleNavigateToResults} 
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] bg-zinc-900/60 rounded-[35px] overflow-hidden relative border border-white/[0.06] transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(139,92,246,0.2)] group-hover:border-violet-500/30">
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-[0.5em] group-hover:text-violet-300 transition-colors">Neural_Preview_{i+1}</span>
                  </div>

                  <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                    <div className="bg-violet-600 text-white text-[9px] font-black px-2 py-1 rounded tracking-tighter uppercase italic shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                      Logic_{ad.score}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-20 text-zinc-300 group-hover:text-white transition-colors duration-500">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 mb-1">{ad.cat}</p>
                    <h3 className="text-lg font-bold tracking-[-0.03em] italic leading-none">{ad.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. System Footer (Monospace & Technical) */}
        <div className="mt-40 pt-10 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-10 text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-[0.3em]">
            <span className="text-zinc-300">© 2026 DropLogic</span>
            <span className="hidden md:block">Neural_Network: Active</span>
            <span className="hidden md:block">Cluster: EU_West_1</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-violet-600"></div>
             </div>
             <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Usage: 64%</span>
          </div>
        </div>

      </main>
    </div>
  );
}