"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomPricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'credits' | 'monthly'>('credits');

  const creditPlans = [
    {
      name: "Starter Pack",
      price: "$9",
      description: "Perfect for testing your first winning dropshipping products.",
      features: ["15 Video Render Credits", "AI Copy Generation Included", "Standard Processing Speed", "720p Video Output"],
      cta: "Buy Credits",
      popular: false
    },
    {
      name: "Scale Bundle",
      price: "$29",
      description: "Engineered for aggressive testing and high-volume product launches.",
      features: ["60 Video Render Credits", "AI Copy & Hashtag Engine", "Priority Render Queue", "1080p HD Video Output", "No Watermarks Locked"],
      cta: "Buy Credits",
      popular: true
    },
    {
      name: "Agency Elite",
      price: "$79",
      description: "Designed for power users running multiple high-budget ad accounts.",
      features: ["200 Video Render Credits", "Full AI Script Automation", "Ultra-Fast Dedicated Rendering", "Ultra HD 4K Output", "Dedicated Support Slot"],
      cta: "Buy Credits",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden flex flex-col">
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      </div>

      {/* Navigation */}
      <nav className="h-16 border-b border-black/[0.08] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 relative z-10 shrink-0">
        <div onClick={() => router.push('/dashboard')} className="text-lg font-black tracking-tighter uppercase italic cursor-pointer">
          DropLogic<span className="text-blue-600">.</span>
        </div>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition"
        >
          ← Back to Dashboard
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col items-center justify-center">
        
        {/* Header Intro */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest block mb-2">
            // Scalable Infrastructure
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-3">
            Fuel Your Product Testing
          </h1>
          <p className="text-gray-400 text-xs font-medium max-w-md mx-auto leading-relaxed">
            Unlock non-watermarked high-retention video rendering, automated AI copy variants, and instant cloud processing.
          </p>
        </div>

        {/* ⚡ PREMIUM HAND-CRAFTED CARDS GRID ⚡ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          {creditPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl p-6 bg-white flex flex-col justify-between transition-all duration-300 ${
                plan.popular 
                  ? 'border-blue-600 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.12)] relative scale-[1.02] z-10' 
                  : 'border-black/[0.08] hover:border-black/20 shadow-sm'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  // Most Popular
                </span>
              )}

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 font-mono">// {plan.name}</h3>
                </div>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">/ One-time</span>
                </div>

                <p className="text-gray-500 text-[11px] leading-relaxed mb-6 font-medium">
                  {plan.description}
                </p>

                <div className="h-[1px] bg-black/[0.06] w-full mb-6"></div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2.5 text-xs font-medium text-black">
                      <span className="text-blue-600 text-[10px]">⚡</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => alert(`Redirecting to payment gateway for ${plan.name}...`)}
                className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10' 
                    : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-mono text-gray-400">
            🔒 Fully secure cryptographic checkout. Credits are deposited to your workspace balance instantly after payment.
          </p>
        </div>

      </main>
    </div>
  );
}