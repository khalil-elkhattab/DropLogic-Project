"use client";
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { UserButton, useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import ScriptEditor, {
  createDefaultScript,
  getActiveHook,
  type AdScript,
} from '@/components/studio/ScriptEditor';
import QuotaPaywall from '@/components/studio/QuotaPaywall';
import ProxiedVideoPlayer from '@/components/results/ProxiedVideoPlayer';
import { getApiUrl, resolveBakedVideoUrl } from '@/lib/backend';
import { downloadVideoFile } from '@/lib/download';
import { resolveBakeVideoUrl, resolvePreviewVideoUrl } from '@/lib/video-url';
import {
  FREE_TIER_PAYWALL_MESSAGE,
  isFreeTierLimitReached,
  type VideoQuota,
} from '@/lib/quota';
import { PLAN_UPDATED_EVENT } from '@/lib/plan-events';

function parseScriptEngine(engine: Record<string, unknown>, productName: string): AdScript {
  const defaults = createDefaultScript(productName);
  const hookOptionsRaw = engine.hook_options;

  let hookOptions: [string, string, string] = defaults.hookOptions;
  if (Array.isArray(hookOptionsRaw) && hookOptionsRaw.length > 0) {
    const hooks = hookOptionsRaw.map((h) => String(h).trim()).filter(Boolean);
    while (hooks.length < 3) {
      hooks.push(hooks[hooks.length - 1] ?? defaults.hookOptions[hooks.length]);
    }
    hookOptions = [hooks[0], hooks[1], hooks[2]];
  } else if (typeof engine.hook === 'string' && engine.hook.trim()) {
    hookOptions = [engine.hook, hookOptions[1], hookOptions[2]];
  }

  return {
    hookOptions,
    selectedHookIndex: 0,
    body: typeof engine.body === 'string' && engine.body.trim() ? engine.body : defaults.body,
    cta: typeof engine.cta === 'string' && engine.cta.trim() ? engine.cta : defaults.cta,
  };
}

function AIStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoQuota, setVideoQuota] = useState<VideoQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  
  const incomingTitle = searchParams.get('title') || searchParams.get('product') || 'Trending Product';
  const incomingAnalysisId = searchParams.get('analysisId') || '';
  const incomingAssetId = searchParams.get('assetId') || 'DL-ASSET-01';

  const initialBakeUrl = resolveBakeVideoUrl(
    searchParams.get('sourceUrl'),
    searchParams.get('videoUrl'),
  );
  const initialPreviewUrl =
    resolvePreviewVideoUrl(searchParams.get('videoUrl'), initialBakeUrl) ||
    (initialBakeUrl ? resolvePreviewVideoUrl(initialBakeUrl) : '');

  const [selectedCardId, setSelectedCardId] = useState(incomingAssetId);
  const [bakeVideoUrl, setBakeVideoUrl] = useState(initialBakeUrl);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(
    initialPreviewUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
  );

  // حالات التحكم في هندسة الاستوديو
  const [aspectRatio, setAspectRatio] = useState('reels'); // 'reels' (9:16) | 'desktop' (16:9) | 'square' (1:1)
  const [selectedHook, setSelectedHook] = useState('problem');
  const [logoImage, setLogoImage] = useState<string | null>(null);  
  const [adScript, setAdScript] = useState<AdScript>(() => createDefaultScript(incomingTitle));
  const [selectedVoice, setSelectedVoice] = useState('premium_male');
  const [bgMusic, setBgMusic] = useState('tiktok_trend_01');
  const [antiBanFilter, setAntiBanFilter] = useState(true);
  const [burnCaptions, setBurnCaptions] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const loadVideoQuota = useCallback(async () => {
    if (!user?.id) {
      setVideoQuota(null);
      setQuotaLoading(false);
      return;
    }

    setQuotaLoading(true);
    try {
      const response = await fetch('/api/video-studio/usage', { cache: 'no-store' });
      if (response.ok) {
        const data: VideoQuota = await response.json();
        setVideoQuota(data);
      }
    } catch (error) {
      console.error('[-] Failed to load video quota:', error);
    } finally {
      setQuotaLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      loadVideoQuota();
    }
  }, [isLoaded, loadVideoQuota]);

  useEffect(() => {
    const handlePlanUpdated = () => {
      void loadVideoQuota();
    };

    window.addEventListener(PLAN_UPDATED_EVENT, handlePlanUpdated);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, handlePlanUpdated);
  }, [loadVideoQuota]);

  useEffect(() => {
    const source = resolveBakeVideoUrl(
      searchParams.get('sourceUrl'),
      searchParams.get('videoUrl'),
    );
    const preview =
      resolvePreviewVideoUrl(searchParams.get('videoUrl'), source) ||
      (source ? resolvePreviewVideoUrl(source) : '');

    if (source) setBakeVideoUrl(source);
    if (preview) setCurrentVideoUrl(preview);

    const assetId = searchParams.get('assetId');
    if (assetId) setSelectedCardId(assetId);
  }, [searchParams]);

  const freeLimitReached = isFreeTierLimitReached(videoQuota);
  const generateDisabled =
    isRendering ||
    isGeneratingScript ||
    quotaLoading ||
    freeLimitReached ||
    !user?.id ||
    !resolveBakeVideoUrl(bakeVideoUrl, searchParams.get('sourceUrl'));

  // دالة جلب النص الذكي المخصص عبر خادم FastAPI الموحد والمباشر
  const fetchAiScriptAngle = async (angleKey: string) => {
    setIsGeneratingScript(true);
    
    let backendAngleName = "problem_solving";
    if (angleKey === "viral") backendAngleName = "tiktok_viral";
    if (angleKey === "scarcity") backendAngleName = "urgency";

    try {
      const response = await fetch('/api/video-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: incomingTitle,
          angle: backendAngleName,
          video_url: bakeVideoUrl || currentVideoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with FastAPI Backend");
      }

      const resData = await response.json();
      
      if (resData?.script_engine) {
        setAdScript(parseScriptEngine(resData.script_engine, incomingTitle));
      }
    } catch (err) {
      console.error("[-] Error routing script generation. Using local fallbacks:", err);
      const fallback = createDefaultScript(incomingTitle);
      if (angleKey === 'viral') {
        fallback.hookOptions[0] = `TikTok made me buy it — this ${incomingTitle} is everywhere.`;
      }
      if (angleKey === 'scarcity') {
        fallback.hookOptions[0] = `Stop scrolling! Warehouse clearing ${incomingTitle} stock tonight.`;
        fallback.cta = `Get 50% off ${incomingTitle} today only — link in bio before midnight.`;
      }
      setAdScript(fallback);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // تشغيل الجلب التلقائي لأول زاوية أو عند تبديل كروت الفيديوهات المحددة
  useEffect(() => {
    if (incomingTitle) {
      fetchAiScriptAngle('problem');
    }
  }, [incomingTitle, currentVideoUrl]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔥 دالة الـ Bake الاحترافية المعدلة لربط وإرسال وتمرير البيانات الحية لصفحة التنزيل بأمان
  const handleStartRender = async () => {
    const sourceForBake = resolveBakeVideoUrl(bakeVideoUrl, searchParams.get('sourceUrl'));
    if (!sourceForBake) {
      window.alert(
        'No valid TikTok source URL found. Go back to Results, select a video asset, and click Launch Studio.',
      );
      return;
    }

    setIsRendering(true);
    setProgress(0);

    // 1. إعداد وتحضير المتغيرات لتتوافق مع خيارات الباكيند الصارمة
    let backendVoice = "en-US-Male-1"; 
    if (selectedVoice === "viral_female") backendVoice = "en-US-Female-1";
    if (selectedVoice === "deep_uk") backendVoice = "en-GB-Male-1";

    let backendMusic = "lofi";
    if (bgMusic === "tiktok_trend_02") backendMusic = "cyberpunk";
    if (bgMusic === "none") backendMusic = "none";

    // 2. تشغيل العداد الوهمي كجزء جمالي من التصميم أثناء معالجة البيانات من السيرفر
    const progressInterval = setInterval(() => {
      setProgress((old) => (old >= 90 ? 90 : old + 5));
    }, 100);

    try {
      // 3. إرسال الطلب الفعلي المليء بالتعديلات الحية إلى الباكيند لطبخ الصوت والميكس
      const response = await fetch(getApiUrl('/api/video-studio/bake'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: incomingTitle,
          video_url: sourceForBake,
          final_hook: getActiveHook(adScript),
          final_body: adScript.body,
          final_cta: adScript.cta,
          selected_voice: backendVoice,
          selected_bg_music: backendMusic,
          watermark_attached: !!logoImage,
          video_duration: 10.0,
          anti_ban_filter: antiBanFilter,
          burn_captions: burnCaptions,
          clerk_user_id: user?.id ?? null,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
        }),
      });

      if (response.status === 403) {
        await loadVideoQuota();
        throw new Error(FREE_TIER_PAYWALL_MESSAGE);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `Baking pipeline failed (${response.status})`);
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result && result.success) {
        await loadVideoQuota();
        const renderId = result.render_id || '';
        const videoUrl =
          result.final_video_url ||
          (renderId ? resolveBakedVideoUrl(renderId) : '');
        const marketingCaption = result.marketing_assets?.video_caption || 'Amazing Product! ✨';

        try {
          await downloadVideoFile(videoUrl);
        } catch (downloadErr) {
          console.warn('Auto-download will retry on publish page:', downloadErr);
        }

        setIsRendering(false);
        const params = new URLSearchParams({
          videoUrl,
          caption: marketingCaption,
          autoDownload: '1',
        });
        if (renderId) params.set('renderId', renderId);
        if (incomingAnalysisId) params.set('analysisId', incomingAnalysisId);
        router.push(`/dashboard/publish?${params.toString()}`);
      }
    } catch (error) {
      console.error("[-] Error during video baking pipeline:", error);
      clearInterval(progressInterval);
      setIsRendering(false);
      const message = error instanceof Error ? error.message : '';
      if (message !== FREE_TIER_PAYWALL_MESSAGE) {
        alert("Something went wrong while baking the video. Check backend logs.");
      }
    }
  };

  // تحويل وتجهيز الروابط المجلوبة من تيك توك لتعمل بمرونة داخل الـ Iframe
  const getVideoEmbedUrl = (url: string) => {
    if (!url) return "";

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = "";
      if (url.includes('/shorts/')) {
        videoId = url.split('/shorts/')[1]?.split(/[?#]/)[0];
      } else {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          videoId = match[2];
        }
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
      }
    }

    if (url.includes('tiktok.com')) {
      const videoIdMatch = url.match(/\/video\/(\d+)/) || url.match(/v\/(\d+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.tiktok.com/embed/v2/${videoIdMatch[1]}?autoplay=1&mute=1`;
      }
    }

    if (url.includes('facebook.com') || url.includes('instagram.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1&mute=1`;
    }

    return url;
  };

  const embeddedUrl = getVideoEmbedUrl(currentVideoUrl);
  
  const useIframePlayer = currentVideoUrl.includes('youtube.com') || 
                          currentVideoUrl.includes('youtu.be') || 
                          currentVideoUrl.includes('tiktok.com') || 
                          currentVideoUrl.includes('facebook.com') || 
                          currentVideoUrl.includes('instagram.com');

  return (
    <div className="dl-page font-sans antialiased relative overflow-hidden flex flex-col h-screen">
      
      <div className="dl-grid-bg" />

      <nav className="dl-nav h-14 flex items-center justify-between px-6 sticky top-0 z-50 select-none relative shrink-0">
        <div className="flex items-center gap-6">
          <DropLogicLogo href="/dashboard" size="sm" suffix="Studio" className="italic text-zinc-100" />
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.04] px-2.5 py-0.5 rounded border border-white/[0.06]">
            Status: <span className="text-green-400 animate-pulse">TikTok_Pipeline_Only</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {videoQuota && (
            <div className="hidden md:block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">
              Videos:{' '}
              <span className={freeLimitReached ? 'text-amber-400' : 'text-violet-300'}>
                {videoQuota.used}/{videoQuota.limit}
              </span>
            </div>
          )}
          <button 
            onClick={() => router.push('/dashboard/results')} 
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"
          >
            &larr; Back to Intelligence
          </button>
          <button
            onClick={handleStartRender}
            disabled={generateDisabled}
            className={`h-9 px-5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${generateDisabled ? 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] cursor-not-allowed' : 'dl-btn-primary'}`}
          >
            {isRendering ? `Baking ${progress}%` : 'Render & Download'}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {freeLimitReached && (
        <div className="relative z-10 px-6 pt-4 max-w-4xl mx-auto w-full">
          <QuotaPaywall
            visible={freeLimitReached}
            used={videoQuota?.used}
            limit={videoQuota?.limit}
          />
        </div>
      )}

      {/* FULL SCREEN PRO EDITOR WORKSPACE */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10 overflow-hidden">
        
        {/* LEFT COLUMN: ONLY AI SCRIPT ENGINE */}
        <section className="lg:col-span-3 border-r border-white/[0.06] bg-white/[0.02] p-6 space-y-6 overflow-y-auto h-full">
          
          <div>
            <div className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest mb-1">// Creative Deployment Pipeline</div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">Script Blueprint</h2>
            <p className="text-zinc-500 text-[11px] font-medium mt-1">
              Engaging narrative structures generated for your selected product asset. Preview and edit your text layers here before baking.
            </p>
            <div className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] rounded px-2 py-1 mt-2 border border-white/[0.06]">
              SYST: {incomingAnalysisId ? `Analysis ${incomingAnalysisId}` : 'Studio'} · Asset {selectedCardId}
              {bakeVideoUrl ? ' · Source locked' : ' · ⚠ No source URL'}
            </div>
          </div>

          <div className="h-[1px] bg-white/[0.06]"></div>

          {/* AI Script Engine */}
          <div className="space-y-4">
            <div>
              <div className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest mb-1">// Script Layering</div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">AI Script Engine</h2>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">AI Optimized Angles</div>
              {[
                { id: 'problem', title: 'Problem-Solving Angle', desc: 'Focuses on pain points and room transformation.' },
                { id: 'viral', title: 'TikTok Viral Hook', desc: 'Uses social proof and organic trends style.' },
                { id: 'scarcity', title: 'Urgency / Price Drop', desc: 'Forces immediate action with warehouse clearing pitch.' }
              ].map((hook) => (
                <button
                  key={hook.id}
                  disabled={isGeneratingScript}
                  onClick={() => {
                    setSelectedHook(hook.id);
                    fetchAiScriptAngle(hook.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${selectedHook === hook.id ? 'border-violet-500/50 bg-violet-600/20 text-white shadow-[0_0_16px_rgba(139,92,246,0.15)]' : 'border-white/[0.08] bg-white/[0.03] text-zinc-200 hover:border-violet-500/25'} ${isGeneratingScript ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-tight flex justify-between items-center">
                    {hook.title}
                    {selectedHook === hook.id && isGeneratingScript && (
                      <span className="text-[8px] font-mono lowercase text-violet-300 animate-pulse">generating...</span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500">{hook.desc}</span>
                </button>
              ))}
            </div>

            <ScriptEditor
              script={adScript}
              disabled={isGeneratingScript}
              onChange={setAdScript}
            />
          </div>
        </section>

        {/* CENTER COLUMN: PREVIEW MONITOR */}
        <section className="lg:col-span-6 bg-[#09090b] flex flex-col justify-between p-6 overflow-y-auto h-full border-r border-white/[0.06]">
          
          <div className="flex justify-center mb-4">
            <div className="bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] flex gap-1 text-[9px] font-black uppercase tracking-wider select-none">
              {[
                { id: 'reels', label: 'Phone / Reels (9:16)' },
                { id: 'square', label: 'Instagram / Square (1:1)' },
                { id: 'desktop', label: 'Computer / Desktop (16:9)' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setAspectRatio(mode.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${aspectRatio === mode.id ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]' : 'text-zinc-500 hover:text-violet-300'}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center p-4 min-h-[380px]">
            <div 
              className={`dl-video-frame bg-[#0d0d0d] text-white relative overflow-hidden transition-all duration-300 flex flex-col justify-between p-5 ${
                aspectRatio === 'reels' ? 'aspect-[9/16] h-full max-h-[500px]' : 
                aspectRatio === 'desktop' ? 'aspect-[16/9] w-full max-w-[620px]' : 
                'aspect-square h-full max-h-[440px]'
              }`}
            >
              
              <div className="absolute inset-0 w-full h-full z-0 bg-black flex items-center justify-center">
                {useIframePlayer ? (
                  <iframe
                    key={embeddedUrl}
                    src={embeddedUrl}
                    className="w-full h-full object-contain opacity-80 border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <ProxiedVideoPlayer
                    key={currentVideoUrl}
                    src={currentVideoUrl}
                    fillFrame
                    variant="fill"
                    autoPlay
                    loop
                    muted
                    controls
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                    label={`Studio preview: ${incomingTitle}`}
                  />
                )}
              </div>

              <div className="flex justify-between items-center z-10 w-full relative">
                {logoImage ? (
                  <img src={logoImage} alt="Watermark" className="h-6 object-contain max-w-[100px] opacity-70" />
                ) : (
                  <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/5">
                    @TIKTOK_WINNER
                  </span>
                )}
                <span className="text-[8px] font-mono bg-black/40 px-2 py-0.5 rounded text-gray-400">
                  {isRendering ? "Baking Engine Active" : "Source: TikTok Ads"}
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center z-10">
                {isRendering ? (
                  <div className="space-y-3 w-full max-w-[200px] bg-black/50 p-4 rounded-xl backdrop-blur-sm">
                    <div className="text-4xl font-black italic tracking-tighter text-violet-400 animate-pulse">{progress}%</div>
                    <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">Neural Rendering...</div>
                  </div>
                ) : (
                  incomingTitle && (
                    <span className="absolute top-12 left-5 font-mono text-[8px] text-white/40 tracking-wider uppercase bg-black/30 px-2 py-0.5 rounded">
                      Editing: {incomingTitle}
                    </span>
                  )
                )}
              </div>

              <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3.5 rounded-xl z-10 shadow-xl max-w-sm mx-auto w-full relative space-y-2">
                <p className="text-[11px] font-bold leading-snug tracking-tight text-yellow-300 line-clamp-2">
                  &ldquo;{getActiveHook(adScript)}&rdquo;
                </p>
                <p className="text-[9px] font-medium leading-snug text-green-300 line-clamp-2 opacity-90">
                  {adScript.body}
                </p>
                <p className="text-[9px] font-bold leading-snug text-yellow-200 line-clamp-1">
                  {adScript.cta}
                </p>
                <div className="flex items-center justify-between text-[7px] font-mono text-gray-400 uppercase tracking-widest border-t border-white/5 pt-1.5">
                  <span>Voice: {selectedVoice}</span>
                  <span className="text-violet-400">Captions Synced</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/[0.06] pt-4 w-full">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">
              <span>00:00 / 00:15</span>
              <span>Render Status: {isRendering ? 'Baking Asset...' : 'Idle'}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative border border-white/[0.06]">
              <div className="h-full bg-violet-600 transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.5)]" style={{ width: isRendering ? `${progress}%` : '35%' }}></div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AUDIO CORE & BRAND IDENTITY */}
        <section className="lg:col-span-3 border-l border-white/[0.06] bg-white/[0.02] p-6 space-y-6 overflow-y-auto h-full">
          
          <div>
            <div className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest mb-1">// Acoustics & Brand</div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">Audio & Protection</h2>
            <p className="text-zinc-500 text-[11px] font-medium mt-1">Configure high-conversion vocal synthesis and protect your asset.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">AI Voice Cloning (Speech)</div>
              <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full h-11 px-3 rounded-xl dl-input font-bold text-xs cursor-pointer">
                <option value="premium_male">Adam (Premium Energetic Male - US)</option>
                <option value="viral_female">Bella (TikTok Trending Female - US)</option>
                <option value="deep_uk">Oliver (Deep Narrative - UK Accent)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Trending E-com BG Music</div>
              <select value={bgMusic} onChange={(e) => setBgMusic(e.target.value)} className="w-full h-11 px-3 rounded-xl dl-input font-bold text-xs cursor-pointer">
                <option value="tiktok_trend_01">Lofi Chill Beats (High Conversion)</option>
                <option value="tiktok_trend_02">Cyberpunk Upbeat Synth</option>
                <option value="none">No Background Music (Raw Sound)</option>
              </select>
            </div>
          </div>

          <div className="h-[1px] bg-white/[0.06]"></div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                  // Auto Burned-In Captions
                </div>
                <p className="text-[11px] font-bold text-zinc-100 leading-snug">
                  TikTok / Hormozi style subtitles
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  Syncs your hook, body, and CTA to the voiceover — bold yellow &amp; green text with black outline, baked into the final MP4.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={burnCaptions}
                aria-label="Auto burned-in captions"
                onClick={() => setBurnCaptions((on) => !on)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                  burnCaptions ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    burnCaptions ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {burnCaptions && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['bold outline', 'lower-third', 'hook → body → cta'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] font-mono font-bold uppercase tracking-wider text-amber-200 bg-white/[0.06] border border-amber-500/30 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-violet-400 block mb-1">
                  // Anti-Ban Smart Filter
                </div>
                <p className="text-[11px] font-bold text-zinc-100 leading-snug">
                  Uniquify video for TikTok
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  Mirrors, micro-speed shifts, and color grading to bypass duplicate-content detection.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={antiBanFilter}
                aria-label="Anti-Ban Smart Filter"
                onClick={() => setAntiBanFilter((on) => !on)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                  antiBanFilter ? 'bg-violet-600' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    antiBanFilter ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {antiBanFilter && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['hflip', 'setpts 1.03', 'atempo 0.97', 'color grade'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] font-mono font-bold uppercase tracking-wider text-violet-200 bg-white/[0.06] border border-violet-500/30 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Overlay Watermark / Brand Logo</div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-11 px-4 rounded-xl dl-input border-dashed font-bold text-xs hover:bg-violet-600/20 hover:border-violet-500/40 transition text-center flex items-center justify-center gap-2">
              {logoImage ? "🔄 Change Uploaded Logo" : "📤 Upload Brand Logo (.PNG)"}
            </button>
            <p className="text-[10px] font-mono text-zinc-500 leading-normal pt-1">
              Upload your transparent PNG store logo to lock it onto the video canvas and protect your engineered ad asset from other drop-shippers.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-[9px] font-mono text-zinc-500 text-center uppercase tracking-widest">
              {freeLimitReached
                ? 'Upgrade to continue generating'
                : 'Edit script above, then generate voice'}
            </p>
            <button
              type="button"
              onClick={handleStartRender}
              disabled={generateDisabled}
              className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${generateDisabled ? 'bg-white/[0.04] text-zinc-600 cursor-not-allowed border border-white/[0.06]' : 'dl-btn-primary'}`}
            >
              {isRendering
                ? 'Processing...'
                : freeLimitReached
                  ? 'Limit Reached'
                  : 'Generate AI Voice & Bake'}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

export default function AIStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="dl-page text-zinc-400 font-mono flex items-center justify-center text-xs">
          // Loading studio workspace...
        </div>
      }
    >
      <AIStudioContent />
    </Suspense>
  );
}