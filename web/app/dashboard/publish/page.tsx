"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserButton } from "@clerk/clerk-react";

export default function SuccessPublishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🔥 استقبال الروابط والنصوص الحية القادمة من صفحة الـ Studio ديناميكياً
  const incomingAudioUrl = searchParams.get('audioUrl') || "";
  const incomingVideoUrl = searchParams.get('videoUrl') || "https://www.w3schools.com/html/mov_bbb.mp4";
  const incomingCaption = searchParams.get('caption') || "This viral Amazon gadget completely transformed my room! 🤫✨";

  // حالات التحكم في نسخ النصوص
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // نصوص الإعلان المولدة تلقائياً بالذكاء الاصطناعي (مربوطة ديناميكياً بالبيانات الحية القادمة)
  const aiAdData = {
    caption: incomingCaption,
    primaryText: incomingCaption.includes("Click the link") 
      ? incomingCaption 
      : `${incomingCaption} Our warehouse is clearing out inventory. This viral setup completely flips your late-night movie experience upside down. Get 50% OFF tonight only. Free Worldwide Shipping included!`,
    hashtags: "#dropshipping #viralproduct #tiktokmademebuyit #amazonfinds #roommakeover #ecommerce",
  };

  // دالة مخصصة لنسخ النصوص إلى الحافظة بنقرة واحدة
  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // دالة تحميل أصل الميديا النهائي لخدمة الدروب شيبينغ
  const handleDownloadAsset = () => {
    if (incomingAudioUrl) {
      window.open(incomingAudioUrl, '_blank');
    } else {
      window.open(incomingVideoUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden flex flex-col h-screen">
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      </div>

      {/* TOP NAVIGATION BAR */}
      <nav className="h-14 border-b border-black/[0.08] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 relative z-10 shrink-0 select-none">
        <div className="flex items-center gap-6">
          <div onClick={() => router.push('/dashboard')} className="text-base font-black tracking-tighter uppercase italic cursor-pointer">
            DropLogic<span className="text-blue-600">.</span>Studio
          </div>
          <div className="h-4 w-[1px] bg-black/10"></div>
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-0.5 rounded border border-green-500/10">
            Asset Status: <span className="font-black animate-pulse">BAKED_&_READY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/studio')} 
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition"
          >
            ← Back to Studio
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* MAIN LAYOUT: Split Workspace */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10 overflow-hidden">
        
        {/* LEFT VIEWPORT (5 Columns): FINAL BAKED VIDEO DISPLAY */}
        <section className="lg:col-span-5 bg-[#fafafa] p-6 flex flex-col justify-between items-center border-r border-black/[0.06] overflow-y-auto h-full">
          <div className="w-full text-left mb-4 shrink-0">
            <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest block">// Master Output Monitor</span>
            <h1 className="text-sm font-black uppercase tracking-tight">Your Engineered Creative</h1>
          </div>

          {/* Cinematic Video Container */}
          <div className="flex-1 w-full flex items-center justify-center p-2">
            <div className="bg-[#060606] text-white border border-black rounded-2xl relative overflow-hidden shadow-2xl w-full aspect-[9/16] max-h-[480px] flex flex-col justify-between p-4">
              
              {/* Overlay Watermark Indicator */}
              <div className="flex justify-between items-center z-10 w-full relative">
                <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/5">
                  🛡️ Logo_Burned_Locked
                </span>
                <span className="text-[8px] font-mono bg-blue-600 px-2 py-0.5 rounded text-white font-bold animate-pulse">
                  Ready to Download
                </span>
              </div>

              {/* Central Video Canvas - عرض الفيديو الحقيقي وبث الصوت المطبوع معاً */}
              <div className="absolute inset-0 w-full h-full z-0 bg-black flex items-center justify-center">
                <video
                  src={incomingVideoUrl}
                  autoPlay
                  loop
                  muted={!incomingAudioUrl} // إذا لم يكن هناك صوت مدمج، يفتح الفيديو العادي غير مكتوم
                  controls
                  playsInline
                  className="w-full h-full object-contain opacity-80"
                />
                
                {/* تشغيل الميكس الصوتي النهائي القادم من الـ Backend بالتزامن مع حركة الفيديو */}
                {incomingAudioUrl && (
                  <audio src={incomingAudioUrl} autoPlay loop controls className="absolute bottom-16 left-4 right-4 h-8 opacity-40 hover:opacity-100 transition z-20 scale-90" />
                )}
              </div>

              {/* Burned Subtitles Block */}
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl z-10 shadow-xl w-full relative">
                <p className="text-[10px] font-bold leading-snug tracking-tight text-yellow-300 line-clamp-2">
                  "{aiAdData.caption}"
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[6px] font-mono text-gray-400 uppercase tracking-widest border-t border-white/5 pt-1">
                  <span>AI Voice Profiling</span>
                  <span className="text-blue-500">Captions Embedded</span>
                </div>
              </div>
            </div>
          </div>

          {/* Native Download Asset Button */}
          <div className="w-full pt-4 border-t border-black/[0.05] mt-4 shrink-0">
            <button 
              onClick={handleDownloadAsset}
              className="w-full h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-[0.99]"
            >
              ⚡ Download High-Res Ad Audio / Video
            </button>
          </div>
        </section>

        {/* RIGHT CONTROLS (7 Columns): AI COPYWRITING HUB & BACK NAVIGATION */}
        <section className="lg:col-span-7 bg-white p-6 space-y-6 overflow-y-auto h-full flex flex-col justify-between">
          
          <div className="space-y-6">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-1">// Marketing Assets Copywriting</div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">AI High-Conversion Copy Hub</h2>
              <p className="text-gray-400 text-[11px] font-medium mt-1">Copy and paste these conversion-ready assets directly into TikTok, Meta, or Pinterest Ads Manager.</p>
            </div>

            {/* BLOCK 1: Title / Caption Field */}
            <div className="border border-black/[0.06] bg-[#fcfcfc] p-4 rounded-xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>// Video Caption / Hook Title</span>
                <button 
                  onClick={() => handleCopy(aiAdData.caption, 'caption')} 
                  className="text-blue-600 hover:text-blue-800 transition font-bold"
                >
                  {copiedSection === 'caption' ? '✅ Copied!' : '📋 Copy Caption'}
                </button>
              </div>
              <div className="p-3 bg-white border border-black/[0.05] rounded-lg text-xs font-bold text-black leading-relaxed">
                {aiAdData.caption}
              </div>
            </div>

            {/* BLOCK 2: Primary Text / Ad Body */}
            <div className="border border-black/[0.06] bg-[#fcfcfc] p-4 rounded-xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>// Primary Ad Copy Text</span>
                <button 
                  onClick={() => handleCopy(aiAdData.primaryText, 'body')} 
                  className="text-blue-600 hover:text-blue-800 transition font-bold"
                >
                  {copiedSection === 'body' ? '✅ Copied Text!' : '📋 Copy Ad Body'}
                </button>
              </div>
              <div className="p-3.5 bg-white border border-black/[0.05] rounded-lg text-xs font-medium text-gray-700 leading-relaxed max-h-[120px] overflow-y-auto">
                {aiAdData.primaryText}
              </div>
            </div>

            {/* BLOCK 3: Viral Hashtags */}
            <div className="border border-black/[0.06] bg-[#fcfcfc] p-4 rounded-xl space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>// Trending E-com Hashtags</span>
                <button 
                  onClick={() => handleCopy(aiAdData.hashtags, 'tags')} 
                  className="text-blue-600 hover:text-blue-800 transition font-bold"
                >
                  {copiedSection === 'tags' ? '✅ Copied Tags!' : '📋 Copy Tags'}
                </button>
              </div>
              <div className="p-3 bg-white border border-black/[0.05] rounded-lg text-xs font-mono font-bold text-blue-600 tracking-tight">
                {aiAdData.hashtags}
              </div>
            </div>

            {/* QUICK GUIDE NOTE */}
            <div className="p-4 bg-gray-50 border border-black/[0.04] rounded-xl">
              <p className="text-[10px] font-mono text-gray-400 leading-normal">
                💡 <span className="font-bold text-gray-600">Pro-Tip:</span> Download the .MP4 asset using the monitor control on the left. Next, copy the AI Engineered Text above and paste it directly into your campaign group. No manual formatting required.
              </p>
            </div>
          </div>

          {/* FOOTER ACTION BUTTONS */}
          <div className="pt-4 border-t border-black/[0.05] mt-4 shrink-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => router.push('/dashboard/studio')}
              className="flex-1 h-11 bg-white border border-black text-black hover:bg-gray-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              🔄 Create Another Video
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 h-11 bg-black text-white hover:bg-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-md"
            >
              🏁 Return to Dashboard
            </button>
          </div>

        </section>

      </main>
    </div>
  );
}