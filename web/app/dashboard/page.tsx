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
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden">
      
      {/* 1. Grid Background (نفس روح الـ Landing Page) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
      >
      </div>

      {/* 2. Navigation (Minimal & Sharp) */}
      <nav className="h-16 border-b border-black/[0.08] bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <DropLogicLogo href="/dashboard" size="md" className="italic" />
          <div className="hidden md:flex gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            <span className="text-black border-b-2 border-black pb-1 cursor-pointer">Workspace</span>
            <span onClick={handleNavigateToPricing} className="hover:text-black cursor-pointer transition text-blue-600 font-black">⚡ Pricing</span>
            <span onClick={handleNavigateToHistory} className="hover:text-black cursor-pointer transition">Ad History</span>
            <span className="hover:text-black cursor-pointer transition">Neural_Feed</span>
            <span className="hover:text-black cursor-pointer transition">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* زر عرض رصيد النقاط الذكي - يوجه لصفحة الشحن والدفع عند الضغط عليه */}
          <div 
            onClick={handleNavigateToPricing}
            className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200/50 cursor-pointer transition tracking-wider uppercase"
          >
            Credits: <span className="font-black">3 Left</span> 🔒
          </div>
          <div className="hidden sm:block text-[9px] font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
            ENGINE_STABLE_200ms
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-16 md:pt-24 pb-24 px-6 md:px-10 relative z-10">
        
        {/* SECTION 1: THE HEADER (High Contrast & Tighter Typography) */}
        <div className="mb-20">
          <header className="mb-12">
            <div className="inline-block px-3 py-1 rounded-full border border-black/[0.08] bg-black/[0.02] text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-6">
              Core Processor v2.0
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.05em] leading-[0.85] text-black mb-8">
              System <br /> 
              <span className="text-gray-300 italic">Intelligence.</span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-medium max-w-xl tracking-tight leading-snug">
              Identify market gaps and validate product logic using our proprietary neural engine.
            </p>
          </header>
          
          {/* Inputs: Advanced but simple */}
          <div className="bg-[#fcfcfc] rounded-[32px] border border-black/[0.08] p-2 flex flex-col md:flex-row gap-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex-[1]">
              <input 
                type="text" 
                placeholder="Product Identifier" 
                className="w-full h-16 px-8 rounded-[24px] bg-white border border-black/[0.03] focus:outline-none focus:ring-2 focus:ring-blue-600/5 font-bold text-sm tracking-tight transition-all"
              />
            </div>
            <div className="flex-[2]">
              <input 
                type="text" 
                placeholder="Paste Reference Link (TikTok, Shop, etc.)" 
                className="w-full h-16 px-8 rounded-[24px] bg-white border border-black/[0.03] focus:outline-none focus:ring-2 focus:ring-blue-600/5 font-medium text-sm tracking-tight transition-all"
              />
            </div>
            {/* ربط زر التحليل الأساسي بصفحة النتائج */}
            <button 
              onClick={handleNavigateToResults}
              className="bg-black text-white h-16 px-12 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.97] shadow-xl shadow-black/10"
            >
              Run Analysis
            </button>
          </div>
        </div>

        {/* SECTION 2: THE CARDS (Minimalist & High-End) */}
        <div className="space-y-12">
          <div className="flex items-end justify-between border-b border-black/[0.05] pb-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-black">Curated Patterns</h2>
              <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest italic">Updated every 60 seconds</p>
            </div>
            {/* ربط رابط العرض بصفحة النتائج أيضاً */}
            <div 
              onClick={handleNavigateToResults} 
              className="text-[10px] font-bold text-blue-600 flex items-center gap-2 cursor-pointer hover:tracking-[0.2em] transition-all"
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
                <div className="aspect-[4/5] bg-[#F2F2F7] rounded-[35px] overflow-hidden relative border border-black/[0.03] transition-all duration-700 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] group-hover:border-black/10">
                  
                  {/* Overlay for professionalism */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[8px] text-gray-300 uppercase tracking-[0.5em] group-hover:text-black transition-colors">Neural_Preview_{i+1}</span>
                  </div>

                  <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                    <div className="bg-black text-white text-[9px] font-black px-2 py-1 rounded tracking-tighter uppercase italic">
                      Logic_{ad.score}
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-8 z-20 text-black group-hover:text-white transition-colors duration-500">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 mb-1">{ad.cat}</p>
                    <h3 className="text-lg font-bold tracking-[-0.03em] italic leading-none">{ad.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. System Footer (Monospace & Technical) */}
        <div className="mt-40 pt-10 border-t border-black/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-10 text-[9px] font-mono font-bold text-gray-300 uppercase tracking-[0.3em]">
            <span className="text-black">© 2026 DropLogic</span>
            <span className="hidden md:block">Neural_Network: Active</span>
            <span className="hidden md:block">Cluster: EU_West_1</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-blue-600"></div>
             </div>
             <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">Usage: 64%</span>
          </div>
        </div>

      </main>
    </div>
  );
}