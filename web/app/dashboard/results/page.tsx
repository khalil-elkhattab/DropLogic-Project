"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { UserButton } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// المكون الداخلي الذي يحتوي على المنطق البرمجي والـ Hooks لمنع أخطاء Next.js
function DashboardContent() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const router = useRouter();
  const searchParams = useSearchParams();

  // تجميع الحالات البرمجية لاستقبال البيانات من السيرفر الخلفي حياً
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // جعل الكلمة تخزّن في الـ State حياً لتتمكن من كتابتها وتغييرها من داخل الصفحة مباشرة
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || 'neck massager');

  // حماية التصميم واستخراج البيانات الحية من خادم الذكاء الاصطناعي الخلفي بدقة
  const currentProductName = analysisData?.product_name || searchQuery;
  const analysisIdCode = analysisData?.analysis_id || "#DL-8892-X";

  // استخدام useCallback لحماية الدالة ومنع الـ Infinite Loop في الـ useEffect
  const triggerLiveAnalysis = useCallback(async (keywordToSearch: string) => {
    if (!keywordToSearch) return;
    setLoading(true); 
    try {
      // 🔥 [الاتصال الحقيقي بالسيرفر الخارجي]: يتطابق تماماً مع منفذ الـ ProductRequest الخاص بالـ FastAPI 2.0.0
      const response = await fetch('http://127.0.0.1:8000/api/run-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordToSearch }) 
      });
      
      if (response.ok) {
        const jsonResult = await response.json();
        
        // ربط البيانات الذكي والمباشر لتتوافق مع مخرجات الـ Backend الحقيقية
        if (jsonResult) {
          setAnalysisData(jsonResult);
          
          // تأمين الحقول المرتجعة للـ Assets سواء كانت raw_assets أو جلبها مباشرة من المخرجات
          const assetsList = jsonResult.raw_assets || jsonResult.assets || [];
          
          if (assetsList && assetsList.length > 0) {
            // توجيه الفيديو المختار الافتراضي الأول ليمر عبر الـ Proxy المعتمد في السيرفر لتخطي CORS
            const firstAsset = assetsList[0];
            const originalUrl = firstAsset.video_url || firstAsset.videoUrl || firstAsset.play || firstAsset.wmplay || "";
            const proxiedUrl = originalUrl 
              ? `http://127.0.0.1:8000/api/proxy-video?url=${encodeURIComponent(originalUrl)}` 
              : "";

            setSelectedVideo({
              ...firstAsset,
              id: firstAsset.id || `DL-ASSET-0`,
              title: firstAsset.title || firstAsset.desc || `Raw Asset # 1`,
              duration: firstAsset.duration || "0:15",
              video_url: proxiedUrl,
              platform: firstAsset.platform || "TikTok"
            });
          } else {
            setSelectedVideo(null);
          }
        }
      }
    } catch (error) {
      console.error("[-] Connection failed to FastAPI Backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تشغيل الفحص والتحميل بأمان عند إقلاع الصفحة مع إضافة الاعتماديات الصحيحة
  useEffect(() => {
    const initialQuery = searchParams.get('query') || searchQuery;
    triggerLiveAnalysis(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, triggerLiveAnalysis]);

  // دالة الانتقال إلى صفحة الاستوديو وتوجيه الرابط إلى الـ generate الخاص بـ FastAPI 2.0
  const handleLaunchStudio = () => {
    if (selectedVideo) {
      const targetVideoUrl = selectedVideo.video_url || selectedVideo.videoUrl || '';
      const targetTitle = selectedVideo.title || currentProductName || '';
      
      const studioParams = new URLSearchParams({
        videoUrl: targetVideoUrl,
        title: targetTitle,
        platform: selectedVideo.platform || 'TikTok'
      });
      router.push(`/dashboard/studio?${studioParams.toString()}`);
    } else {
      router.push(`/dashboard/studio?title=${encodeURIComponent(currentProductName)}`);
    }
  };

  // دالة فحص روابط المتاجر المنافسة الحية وتوجيه المستخدم إليها عند الضغط على Inspect
  const handleInspectStore = (domain: string) => {
    if (!domain) return;
    const targetUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };
  
  // 🎯 قراءة الـ Metrics الحية القادمة من الـ API مباشرة
  const metrics = [
    { 
      label: "Logic Score", 
      value: analysisData?.metrics?.logic_score ? Number(analysisData.metrics.logic_score).toFixed(1) : "0.0", 
      sub: Number(analysisData?.metrics?.logic_score) >= 8.5 ? "Highly Optimistic" : "Moderate Growth", 
      trend: "Top 2% of markets" 
    },
    { 
      label: "Audience Sentiment", 
      value: analysisData?.metrics?.sentiment || "0%", 
      sub: "Positive Resonance", 
      trend: "+12% active intent" 
    },
    { 
      label: "Saturation Index", 
      value: analysisData?.metrics?.saturation || "Fetching...", 
      sub: "Room for Scale", 
      trend: "Active competitors track" 
    },
    { 
      label: "Est. Net Margin", 
      value: analysisData?.metrics?.net_margin || "0%", 
      sub: `Target Profit Pool`, 
      trend: "Based on market metrics" 
    }
  ];

  // 🎯 استخراج المتاجر الحية المقيدة من مصفوفة intercepted_stores المرتجعة من السيرفر
  const interceptedStores = (analysisData?.intercepted_stores && analysisData.intercepted_stores.length > 0) 
    ? analysisData.intercepted_stores.map((store: any) => ({
        domain: store.domain || "unknown.co",
        price: store.price || "$0.00",
        spend: store.spend || "Medium",
        color: store.spend === "High" ? "text-red-500" : store.spend === "Low" ? "text-green-500" : "text-amber-500"
      }))
    : [];

  // 🎯 استخراج عبارات الجمهور الحقيقية المستهدفة من مصفوفة audience_phrases
  const audiencePhrases = (analysisData?.audience_phrases && analysisData.audience_phrases.length > 0)
    ? analysisData.audience_phrases
    : ["No active audience trends returned from the neural pipeline yet."];

  // 🔥 [تم الإصلاح هنا بنجاح]: استخراج الرابط المنفصل لكل فيديو بشكل ديناميكي (Dynamic Mapping) بناءً على الكائن الحالي `asset`
  const fetchedAssets = analysisData?.raw_assets || analysisData?.assets || [];
  const rawAssets = (fetchedAssets.length > 0)
    ? fetchedAssets.map((asset: any, index: number) => {
        // قراءة الرابط الصحيح للفيديو الحالي في الدورة من الـ API دون تكرار العنصر الأول
        const originalUrl = asset.video_url || asset.videoUrl || asset.play || asset.wmplay || "";
        const proxiedUrl = originalUrl 
          ? `http://127.0.0.1:8000/api/proxy-video?url=${encodeURIComponent(originalUrl)}` 
          : "";

        return {
          id: asset.id || `DL-ASSET-${index}`,
          title: asset.title || asset.desc || `Raw Asset # ${index + 1}`,
          duration: asset.duration || "0:15",
          video_url: proxiedUrl, 
          platform: asset.platform || "TikTok"
        };
      })
    : [{ id: "DL-EMPTY", title: `Scanning live assets for ${currentProductName}...`, duration: "0s", video_url: "", platform: "System" }];

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden">
      
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '30px 30px' }}>
      </div>

      {/* Navigation Bar */}
      <nav className="h-16 border-b border-black/[0.08] bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="text-lg font-black tracking-tighter uppercase italic">
            DropLogic<span className="text-blue-600">.</span> 
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded border border-black/[0.04]">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
            Analysis_ID: {analysisIdCode}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-black/10 pr-6">
            <div>Market: <span className="text-black">{analysisData?.market || "US"}_⚡</span></div>
            <div>Currency: <span className="text-black">USD_($)</span></div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-12 pb-24 px-6 md:px-10 relative z-10">
        
        {/* PRODUCT HEADER & PLATFORM SWITCHER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-b-black/[0.06] pb-8">
          <div className="w-full md:max-w-xl space-y-4">
            <div className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-[0.3em]">
              {loading ? "// Extruding neural pipeline vectors..." : "// Neural analysis result"}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.04em] text-black italic capitalize leading-none">
              {currentProductName} <span className="text-gray-300 font-sans not-italic">.report</span>
            </h1>

            <div className="flex gap-2 pt-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter custom product to search..."
                className="h-10 border border-black/[0.08] rounded-xl px-4 text-xs font-bold bg-gray-50 focus:outline-none focus:border-black w-full font-sans text-black"
              />
              <button 
                onClick={() => triggerLiveAnalysis(searchQuery)}
                disabled={loading}
                className="h-10 bg-black text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-[0.97]"
              >
                {loading ? 'Analyzing...' : 'Run_Analysis'}
              </button>
            </div>
          </div>
          
          {/* Tabs Control */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-black/[0.05] text-[10px] font-black uppercase tracking-wider gap-1 self-start md:self-end">
            {['intelligence', 'competitors', 'sentiment', 'video studio'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${activeTab === tab ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 1. HERO KPI METRICS BRICKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-[#fcfcfc] border border-black/[0.06] rounded-2xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{metric.label}</p>
              <div className="text-4xl font-bold tracking-[-0.06em] text-black mb-1 leading-none">{metric.value}</div>
              <p className="text-[11px] font-bold text-black uppercase tracking-tight italic">{metric.sub}</p>
              <p className="text-[9px] font-mono text-gray-400 mt-4 border-t border-black/[0.03] pt-2">{metric.trend}</p>
            </div>
          ))}
        </div>

        {/* 2. MAIN DATA SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUMN 1 & 2: DYNAMIC CONTENT BASED ON TABS */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'intelligence' && (
              <>
                {/* COMPETITOR MATRIX */}
                <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-b-black/[0.06] bg-[#fcfcfc] flex justify-between items-center">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">Intercepted Stores</h3>
                    <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Active Track</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/[0.04] text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                          <th className="px-6 py-3">Store Domain</th>
                          <th className="px-6 py-3">Retail Price</th>
                          <th className="px-6 py-3">Ad Spend Est.</th>
                          <th className="px-6 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] font-medium text-black">
                        {interceptedStores.length > 0 ? (
                          interceptedStores.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-black/[0.03] hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold tracking-tight">{row.domain}</td>
                              <td className="px-6 py-4 font-mono font-bold">{row.price}</td>
                              <td className="px-6 py-4 font-mono"><span className={`font-bold ${row.color}`}>{row.spend}</span></td>
                              <td 
                                onClick={() => handleInspectStore(row.domain)}
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline cursor-pointer select-none"
                              >
                                Inspect →
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-mono text-xs">
                              Gathering live intelligence matrix from API...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AD PATTERN INSIGHT */}
                <div className="p-6 border border-black/[0.06] rounded-2xl bg-[#fcfcfc]">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black mb-4">Recommended Angle</h3>
                  <div className="text-xl md:text-2xl font-bold tracking-tight text-black leading-snug mb-2">
                    {analysisData?.metrics?.saturation === "High" ? (
                      <>"High Market Density. Sell the <span className="text-blue-600 italic">Premium Differentiation</span>."</>
                    ) : (
                      <>"Stop focusing on tech specs. Sell the <span className="text-gray-300 italic">mental escape</span>."</>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs font-medium max-w-xl">
                    Live dynamic analytics indicate native hooks and targeted user problem resolution scale campaigns up to 4.2x more efficiently.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'competitors' && (
              <div className="p-8 border border-black/[0.06] rounded-2xl text-center font-mono text-xs text-gray-400">
                &gt; Deep crawling active store pipelines... showing {interceptedStores.length} matches found live on global monitors.
              </div>
            )}

            {activeTab === 'sentiment' && (
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black">Audience Phrases</h3>
                {audiencePhrases.map((phrase: string, idx: number) => (
                  <div key={idx} className="p-4 border border-black/[0.04] rounded-xl font-medium text-xs flex gap-4 items-center">
                    <span className="font-mono text-gray-300">0{idx+1}</span>
                    <p className="text-black italic">"{phrase}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Video Studio Tab */}
            {activeTab === 'video studio' && (
              <div className="p-8 border border-black/[0.06] bg-[#fcfcfc] rounded-2xl space-y-6">
                <div>
                  <div className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-[0.3em] mb-2">// Creative Deployment Pipeline</div>
                  <h3 className="text-2xl font-bold tracking-tight text-black italic">Raw Ads Captured</h3>
                  <p className="text-gray-500 text-xs font-medium mt-1 max-w-xl">
                    Our system has extracted the highest-performing raw video assets for this product. Hover your mouse or touch a video to preview it, and click to select and auto-play in the focus stream.
                  </p>
                </div>

                {/* مشغل البث الرئيسي للفيديو المختار - تم إضافة ميزة الصمت لدمج الـ AI */}
                {selectedVideo && selectedVideo.video_url && selectedVideo.id !== "DL-EMPTY" && (
                  <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video relative border border-black/10 shadow-lg">
                    <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white px-3 py-1 rounded-full uppercase tracking-widest">
                      ⚡ Active Player: {selectedVideo.title}
                    </div>
                    <video 
                      key={selectedVideo.id} 
                      src={selectedVideo.video_url} 
                      controls 
                      autoPlay
                      muted // 🔇 تم جعل الفيديو صامت هنا بشكل أساسي
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  </div>
                )}

                {/* كروت الفيديوهات الأربعة المنفصلة والديناميكية بالكامل */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {rawAssets.filter((v: any) => v.id !== "DL-EMPTY").map((video: any) => {
                    const isSelected = selectedVideo?.id === video.id;
                    const hasValidVideo = video.video_url && video.id !== "DL-EMPTY";
                    
                    return (
                      <div 
                        key={video.id} 
                        onClick={() => hasValidVideo && setSelectedVideo(video)}
                        className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${hasValidVideo ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                          isSelected ? 'border-black bg-black/[0.02] shadow-sm' : 'border-black/[0.04] bg-white hover:border-black/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-mono text-[9px] font-black tracking-tighter">
                              {video.platform.toUpperCase().substring(0, 4)}
                            </div>
                            <div className="max-w-[150px] sm:max-w-[180px]">
                              <p className="text-xs font-bold text-black truncate">{video.title}</p>
                              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mt-0.5">Duration: {video.duration}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-green-600 bg-green-50'
                          }`}>
                            {isSelected ? 'Selected' : hasValidVideo ? 'Ready' : 'Empty'}
                          </span>
                        </div>

                        {/* مشغل الفيديو الصغير للمعاينة السريعة بالـ Hover مع كتم الصوت */}
                        {hasValidVideo && (
                          <div className="w-full rounded-lg overflow-hidden bg-black mt-2 aspect-video relative">
                            <video 
                              src={video.video_url} 
                              muted // 🔇 صامت تماماً لمنع حدوث تداخل أصوات
                              playsInline
                              preload="auto"
                              className="w-full h-full object-cover pointer-events-none"
                              onMouseEnter={(e) => {
                                e.currentTarget.play().catch(err => console.log("Autoplay context blocked:", err));
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {rawAssets.length === 1 && rawAssets[0].id === "DL-EMPTY" && (
                    <div className="col-span-2 text-center py-8 text-xs font-mono text-gray-400">
                      No dynamic video pipelines connected yet. Run an analysis.
                    </div>
                  )}
                </div>

                {/* زر الإطلاق */}
                <div className="pt-4 border-t border-black/[0.03]">
                  <button 
                    onClick={handleLaunchStudio}
                    disabled={!selectedVideo || selectedVideo.id === "DL-EMPTY"}
                    className="w-full sm:w-auto h-12 bg-black text-white px-8 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.98] shadow-md disabled:opacity-40"
                  >
                    Launch Full Editing Studio ({selectedVideo?.platform || 'Select Asset'}) →
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* COLUMN 3: THE AI BLUEPRINT */}
          <div className="space-y-6">
            <div className="bg-black text-white p-6 rounded-2xl shadow-xl shadow-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-gray-600 uppercase tracking-widest">Decision Cluster</div>
              
              <div className="inline-block bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-6">
                System Recommendation
              </div>
              
              <h3 className="text-2xl font-bold tracking-tight italic leading-tight mb-4">
                {Number(analysisData?.metrics?.logic_score) >= 8.2 ? (
                  <>Green Light. <br />Deploy Campaign.</>
                ) : (
                  <>Hold Pipeline. <br />Awaiting Signals.</>
                )}
              </h3>
              
              <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">
                The monitored query tracking metrics show a viability margin scaling up to {analysisData?.metrics?.net_margin || "0%"}. Deployment in targeted geolocation sectors is highly recommended.
              </p>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">
                <span>Confidence Level</span>
                <span className="text-green-400">
                  {analysisData?.metrics?.logic_score ? `${(Number(analysisData.metrics.logic_score) * 10.3).toFixed(1)}% Accurate` : "0.0% Accurate"}
                </span>
              </div>
            </div>

            {/* QUICK EXPORT */}
            <button className="w-full h-14 border border-black bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all active:scale-[0.98]">
              Export Logic Blueprint
            </button>
          </div>

        </div>

        {/* System Footer Bar */}
        <div className="mt-24 pt-8 border-t border-black/[0.04] flex flex-col sm:flex-row justify-between items-center text-[9px] font-mono text-gray-300 font-bold uppercase tracking-[0.2em]">
          <span>© 2026 DropLogic Labs. All rights reserved.</span>
          <span className="text-black">Pipeline: Stable_Secure_SSL</span>
        </div>

      </main>
    </div>
  );
}

// المكون المصدّر النهائي المدعوم بـ Suspense
export default function DashboardResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white text-black font-mono flex items-center justify-center text-xs">
        // Loading dynamic search parameters pipeline...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}