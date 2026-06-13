"use client";
import React from 'react';
import Link from 'next/link';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton 
} from "@clerk/clerk-react";
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import FaqAccordion from '@/components/FaqAccordion';

export default function Home() {
  const testimonials = [
    {
      name: "Alex M.",
      role: "E-com Strategist",
      text: "The Neural Search is a game changer. It found a winning product in the Home Decor niche that I completely overlooked.",
      stars: 5
    },
    {
      name: "Sarah Chen",
      role: "TikTok Seller",
      text: "Finally, a tool that doesn't just scrape data but actually explains the logic behind market trends. High ROI tool.",
      stars: 5
    },
    {
      name: "Marcus J.",
      role: "Scaling Expert",
      text: "Dropped my ad spend by 30% using the optimization logic. It's like having a senior analyst in your pocket.",
      stars: 5
    }
  ];

  return (
    <div className="dl-page dl-page-elevated selection:bg-violet-500/30 selection:text-white font-sans">
      
      {/* 1. The Grid Background */}
      <div className="dl-grid-bg" />

      {/* 2. Navigation */}
      <nav className="dl-nav">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <DropLogicLogo href="/" size="md" className="text-zinc-100" />
            <div className="hidden md:flex gap-6 text-[13px] font-medium text-zinc-400">
              <a href="#demo" className="hover:text-violet-300 transition">Demo</a>
              <a href="#features" className="hover:text-violet-300 transition">Solutions</a>
              <a href="#faq" className="hover:text-violet-300 transition">FAQ</a>
              <a href="#feedback" className="hover:text-violet-300 transition">Feedback</a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-[13px] font-medium text-zinc-400 hover:text-white px-2">Log in</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="text-[11px] md:text-[13px] dl-btn-primary px-3 md:px-4 py-1.5 rounded-full font-medium whitespace-nowrap">
                  Get Started
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="text-[13px] font-bold text-violet-400 mr-2 hover:text-violet-300">Dashboard</Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-20 px-6 md:px-8 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-start text-left">
            <div className="mb-6 dl-badge">
              v1.0 — Now with Neural Search
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[120px] font-bold tracking-[-0.04em] leading-[0.9] md:leading-[0.85] mb-10 text-pretty text-zinc-50">
              Smart commerce <br /> 
              <span className="text-zinc-500 italic">built with logic.</span>
            </h1>

            <div className="grid md:grid-cols-2 gap-12 w-full items-end">
              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-md">
                DropLogic AI automates the complex parts of dropshipping. Master the market with precision algorithms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end w-full sm:w-auto">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="dl-btn-primary px-6 md:px-10 py-4 rounded-full text-base md:text-lg hover:scale-[1.02] w-full sm:w-auto">
                      Get Started Free
                    </button>
                  </SignInButton>
                </SignedOut>
                
                <SignedIn>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <button className="dl-btn-primary px-6 md:px-10 py-4 rounded-full text-base md:text-lg hover:scale-[1.02] w-full">
                      Go to Dashboard
                    </button>
                  </Link>
                </SignedIn>

                <a href="#demo" className="dl-btn-secondary px-6 md:px-10 py-4 rounded-full text-base md:text-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                  <span>Watch Demo</span>
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* باقي الأقسام (فيديو، مميزات، تعليقات) تبقى كما هي تماماً بدون تغيير */}
      <section id="demo" className="px-6 md:px-8 pb-20 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="dl-glass p-2 md:p-4 shadow-[0_40px_100px_-20px_rgba(139,92,246,0.12)]">
            <div className="dl-video-frame bg-black aspect-video rounded-[18px] md:rounded-[32px] group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[8px] md:border-t-[10px] border-t-transparent border-l-[14px] md:border-l-[18px] border-l-white border-b-[8px] md:border-b-[10px] border-b-transparent ml-1"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-white/50 font-mono text-[8px] md:text-[10px] uppercase tracking-[0.2em]">
                    DropLogic_Interface_v1.mp4
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ... بقية الكود كما هو في ملفك الأصلي ... */}
      <section id="features" className="px-6 md:px-8 py-20 md:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 text-left">
            <div className="max-w-xl">
              <h2 className="dl-section-title mb-6">Built for precision.</h2>
              <p className="text-zinc-400 text-lg">Stop gambling with your ad spend. Our neural engine processes millions of data points to give you the truth.</p>
            </div>
            <div className="text-violet-400 font-mono text-[10px] tracking-widest uppercase mb-2">Technical_Specs.v1</div>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div className="dl-glass-subtle p-6 space-y-4">
              <div className="text-violet-400 font-bold text-xl">01.</div>
              <h4 className="font-bold text-lg italic uppercase text-zinc-100">Neural Trend Detection</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">Identifies products before they hit the mainstream by analyzing early-stage TikTok engagement patterns.</p>
            </div>
            <div className="dl-glass-subtle p-6 space-y-4">
              <div className="text-violet-400 font-bold text-xl">02.</div>
              <h4 className="font-bold text-lg italic uppercase text-zinc-100">Margin Protection</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">Real-time shipping and VAT calculation logic to ensure you never sell a product at a loss.</p>
            </div>
            <div className="dl-glass-subtle p-6 space-y-4">
              <div className="text-violet-400 font-bold text-xl">03.</div>
              <h4 className="font-bold text-lg italic uppercase text-zinc-100">Competitor Logic</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">Instantly see the exact store theme, apps, and pricing strategy of every successful competitor.</p>
            </div>
          </div>
        </div>
      </section>

      <FaqAccordion />

      {/* Feedback Section */}
      <section id="feedback" className="px-6 md:px-8 py-20 md:py-32 border-y border-white/[0.06] relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-12 md:mb-16">Trusted by the next generation</h3>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((item, index) => (
              <div key={index} className="dl-glass p-6 md:p-8 text-left hover:border-violet-500/30 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(item.stars)].map((_, star) => (
                    <div key={star} className="w-2.5 h-2.5 md:w-3 md:h-3 bg-violet-500 rounded-full"></div>
                  ))}
                </div>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6 italic">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-500/20 rounded-full flex items-center justify-center font-bold text-[10px] text-violet-300">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs md:text-sm text-zinc-100">{item.name}</div>
                    <div className="text-[10px] md:text-xs text-zinc-500">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="p-12 text-center border-t border-white/[0.06] relative z-10">
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4 text-[11px] font-medium text-zinc-500">
          <Link href="/privacy" className="hover:text-violet-300 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-violet-300 transition">Terms of Service</Link>
        </div>
        <div className="text-[10px] md:text-[12px] text-zinc-600 font-mono">
          © 2026 DROPLOGIC. ALL RIGHTS RESERVED. <br />
          <span className="mt-2 inline-block">ENGINEERED FOR EXCELLENCE.</span>
        </div>
      </footer>
    </div>
  );
}