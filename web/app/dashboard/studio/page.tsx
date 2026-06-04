"use client";
import React, { useState, useRef, useEffect } from 'react';
import { UserButton } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from 'next/navigation';

export default function AIStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // استقبال رابط الفيديو الممرر ديناميكياً من خيار المستخدم في صفحة النتائج
  const incomingVideoUrl = searchParams.get('videoUrl') || "https://www.w3schools.com/html/mov_bbb.mp4";
  const incomingTitle = searchParams.get('title') || "Trending Product";

  // --- ميزة كرت التيك توك المختار المستخرج ديناميكياً من نظام التصفية والبحث الجديد لخدمة الدروب شيبينغ ---
  const [selectedCardId, setSelectedCardId] = useState('DL-ASSET-01');
  const [currentVideoUrl, setCurrentVideoUrl] = useState(incomingVideoUrl);

  // حالات التحكم في هندسة الاستوديو
  const [aspectRatio, setAspectRatio] = useState('reels'); // 'reels' (9:16) | 'desktop' (16:9) | 'square' (1:1)
  const [selectedHook, setSelectedHook] = useState('problem');
  const [logoImage, setLogoImage] = useState<string | null>(null);  
  const [customText, setCustomText] = useState('This viral Amazon gadget completely transformed my late-night setup. Get 50% off tonight only.');
  const [selectedVoice, setSelectedVoice] = useState('premium_male');
  const [bgMusic, setBgMusic] = useState('tiktok_trend_01');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // دالة جلب النص الذكي المخصص عبر خادم FastAPI الموحد والمباشر
  const fetchAiScriptAngle = async (angleKey: string) => {
    setIsGeneratingScript(true);
    
    let backendAngleName = "problem_solving";
    if (angleKey === "viral") backendAngleName = "tiktok_viral";
    if (angleKey === "scarcity") backendAngleName = "urgency";

    try {
      const response = await fetch('http://127.0.0.1:8000/api/video-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: incomingTitle,
          angle: backendAngleName,
          video_url: currentVideoUrl
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with FastAPI Backend");
      }

      const resData = await response.json();
      
      if (resData?.success && resData?.script_engine) {
        const engine = resData.script_engine;
        const fullScript = `${engine.hook}\n\n${engine.body}\n\n${engine.cta}`;
        setCustomText(fullScript);
      }
    } catch (err) {
      console.error("[-] Error routing directly to FastAPI. Using local fallbacks:", err);
      if (angleKey === 'problem') setCustomText(`This viral Amazon gadget completely transformed my late-night setup. Get 50% off tonight only for ${incomingTitle}.`);
      if (angleKey === 'viral') setCustomText(`TikTok made me buy it! 🤫 This is why everyone is obsessed with this ${incomingTitle} right now.`);
      if (angleKey === 'scarcity') setCustomText(`Stop scrolling! 🚨 Our warehouse is clearing out inventory for ${incomingTitle}. Price drops for the next 4 hours.`);
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

  // 🔥 دالة الـ Bake الاحترافية المعدلة لربط وإرسال وتمرير البيانات الحية لصفحة التنزيل
  const handleStartRender = async () => {
    setIsRendering(true);
    setProgress(0);

    // 1. إعداد وتحضير المتغيرات لتتوافق مع خيارات الباكيند الصارمة
    let backendVoice = "adam";
    if (selectedVoice === "viral_female") backendVoice = "bella";
    if (selectedVoice === "deep_uk") backendVoice = "oliver";

    let backendMusic = "none";
    if (bgMusic === "tiktok_trend_01") backendMusic = "lofi-lofi-music-496553";
    if (bgMusic === "tiktok_trend_02") backendMusic = "cyberpunk";

    // 2. تشغيل العداد الوهمي كجزء جمالي من التصميم أثناء معالجة البيانات من السيرفر
    const progressInterval = setInterval(() => {
      setProgress((old) => (old >= 90 ? 90 : old + 5));
    }, 100);

    try {
      // 3. إرسال الطلب الفعلي المليء بالتعديلات الحية إلى الباكيند لطبخ الصوت والميكس
      const response = await fetch('http://127.0.0.1:8000/api/video-studio/bake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: incomingTitle,
          video_url: currentVideoUrl,
          final_hook: customText.split('\n\n')[0] || customText,
          final_body: customText.split('\n\n')[1] || "This is a viral product you must see.",
          final_cta: customText.split('\n\n')[2] || "Click the link below to get yours today.",
          selected_voice: backendVoice,
          selected_bg_music: backendMusic,
          watermark_attached: !!logoImage,
          logo_url: logoImage
        })
      });

      if (!response.ok) throw new Error("Baking pipeline failed on server side.");

      const result = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      // 4. تمرير روابط الفيديو والصوت النهائي ومستندات التسويق لصفحة الـ download (publish) بذكاء
      if (result && result.success) {
        const audioUrl = result.master_output.generated_audio_url;
        const videoUrl = result.master_output.video_stream_url;
        const marketingCaption = result.marketing_assets.video_caption;

        setTimeout(() => {
          setIsRendering(false);
          // الانتقال مع تمرير الروابط حية عبر الـ URL Search Params لتقرأها صفحة التنزيل فوراً!
          router.push(`/dashboard/publish?audioUrl=${encodeURIComponent(audioUrl)}&videoUrl=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(marketingCaption)}`);
        }, 500);
      }
    } catch (error) {
      console.error("[-] Error during video baking pipeline:", error);
      clearInterval(progressInterval);
      setIsRendering(false);
      alert("Something went wrong while baking the video. Check backend logs.");
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
    <div className="min-h-screen bg-white text-black font-sans antialiased relative overflow-hidden flex flex-col">
      
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      </div>

      {/* WORKSPACE NAVIGATION */}
      <nav className="h-14 border-b border-black/[0.08] bg-white/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 relative z-10 select-none">
        <div className="flex items-center gap-6">
          <div onClick={() => router.push('/dashboard')} className="text-base font-black tracking-tighter uppercase italic cursor-pointer">
              DropLogic<span className="text-blue-600">.Studio</span>
          </div>
          <div className="h-4 w-[1px] bg-black/10 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-0.5 rounded border border-black/[0.03]">
            Status: <span className="text-green-500 animate-pulse">TikTok_Pipeline_Only</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/results')} 
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition"
          >
            ← Back to Intelligence
          </button>
          <button
            onClick={handleStartRender}
            disabled={isRendering}
            className={`h-9 px-5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isRendering ? 'bg-gray-100 text-gray-400 border border-black/5 cursor-not-allowed' : 'bg-black text-white hover:bg-blue-600'}`}
          >
            {isRendering ? `Baking ${progress}%` : 'Render & Download'}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* FULL SCREEN PRO EDITOR WORKSPACE */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10 overflow-hidden">
        
        {/* LEFT COLUMN: ONLY AI SCRIPT ENGINE */}
        <section className="lg:col-span-3 border-r border-black/[0.06] bg-[#fcfcfc] p-6 space-y-6 overflow-y-auto h-full">
          
          <div>
            <div className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-1">// Creative Deployment Pipeline</div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black">Script Blueprint</h2>
            <p className="text-gray-400 text-[11px] font-medium mt-1">
              Engaging narrative structures generated for your selected product asset. Preview and edit your text layers here before baking.
            </p>
            <div className="text-[9px] font-mono text-gray-400 bg-gray-100 rounded px-2 py-1 mt-2 border border-black/[0.03]">
              SYST: Active script binding for {incomingTitle}...
            </div>
          </div>

          <div className="h-[1px] bg-black/[0.05]"></div>

          {/* AI Script Engine */}
          <div className="space-y-4">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-1">// Script Layering</div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">AI Script Engine</h2>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">AI Optimized Angles</label>
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
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${selectedHook === hook.id ? 'border-black bg-black text-white shadow-sm' : 'border-black/[0.05] bg-white text-black hover:border-black/20'} ${isGeneratingScript ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-tight flex justify-between items-center">
                    {hook.title}
                    {selectedHook === hook.id && isGeneratingScript && (
                      <span className="text-[8px] font-mono lowercase text-blue-400 animate-pulse">generating...</span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">{hook.desc}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Live Script Customization</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                className="w-full p-4 rounded-xl border border-black/[0.06] bg-white text-xs font-medium leading-relaxed focus:outline-none focus:border-black transition resize-none"
              />
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: PREVIEW MONITOR */}
        <section className="lg:col-span-6 bg-white flex flex-col justify-between p-6 overflow-y-auto h-full border-r border-black/[0.06]">
          
          <div className="flex justify-center mb-4">
            <div className="bg-gray-50 p-1 rounded-xl border border-black/[0.05] flex gap-1 text-[9px] font-black uppercase tracking-wider select-none">
              {[
                { id: 'reels', label: 'Phone / Reels (9:16)' },
                { id: 'square', label: 'Instagram / Square (1:1)' },
                { id: 'desktop', label: 'Computer / Desktop (16:9)' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setAspectRatio(mode.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${aspectRatio === mode.id ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center p-4 min-h-[380px]">
            <div 
              className={`bg-[#0d0d0d] text-white border border-black/[0.1] rounded-2xl relative overflow-hidden transition-all duration-300 shadow-2xl flex flex-col justify-between p-5 ${
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
                  <video
                    key={currentVideoUrl}
                    src={currentVideoUrl}
                    autoPlay
                    loop
                    muted
                    controls
                    playsInline
                    className="w-full h-full object-contain opacity-80"
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
                    <div className="text-4xl font-black italic tracking-tighter text-blue-500 animate-pulse">{progress}%</div>
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

              <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3.5 rounded-xl z-10 shadow-xl max-w-sm mx-auto w-full relative">
                <p className="text-[11px] font-bold leading-snug tracking-tight text-yellow-300 whitespace-pre-line">
                  "{customText || "Your subtitle text placeholder..."}"
                </p>
                <div className="mt-2 flex items-center justify-between text-[7px] font-mono text-gray-400 uppercase tracking-widest border-t border-white/5 pt-1.5">
                  <span>Voice: {selectedVoice}</span>
                  <span className="text-blue-500">Auto Captions Synced</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-black/[0.04] pt-4 w-full">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>00:00 / 00:15</span>
              <span>Render Status: {isRendering ? 'Baking Asset...' : 'Idle'}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative border border-black/[0.02]">
              <div className="h-full bg-black transition-all duration-300" style={{ width: isRendering ? `${progress}%` : '35%' }}></div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AUDIO CORE & BRAND IDENTITY */}
        <section className="lg:col-span-3 border-l border-black/[0.06] bg-[#fcfcfc] p-6 space-y-6 overflow-y-auto h-full">
          
          <div>
            <div className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-widest mb-1">// Acoustics & Brand</div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black">Audio & Protection</h2>
            <p className="text-gray-400 text-[11px] font-medium mt-1">Configure high-conversion vocal synthesis and protect your asset.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">AI Voice Cloning (Speech)</label>
              <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-white border border-black/[0.06] font-bold text-xs cursor-pointer focus:outline-none focus:border-black transition">
                <option value="premium_male">Adam (Premium Energetic Male - US)</option>
                <option value="viral_female">Bella (TikTok Trending Female - US)</option>
                <option value="deep_uk">Oliver (Deep Narrative - UK Accent)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Trending E-com BG Music</label>
              <select value={bgMusic} onChange={(e) => setBgMusic(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-white border border-black/[0.06] font-bold text-xs cursor-pointer focus:outline-none focus:border-black transition">
                <option value="tiktok_trend_01">Lofi Chill Beats (High Conversion)</option>
                <option value="tiktok_trend_02">Cyberpunk Upbeat Synth</option>
                <option value="none">No Background Music (Raw Sound)</option>
              </select>
            </div>
          </div>

          <div className="h-[1px] bg-black/[0.05]"></div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Overlay Watermark / Brand Logo</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-11 px-4 rounded-xl bg-white border border-black/[0.06] border-dashed font-bold text-xs hover:bg-black hover:text-white transition text-center flex items-center justify-center gap-2 shadow-sm">
              {logoImage ? "🔄 Change Uploaded Logo" : "📤 Upload Brand Logo (.PNG)"}
            </button>
            <p className="text-[10px] font-mono text-gray-400 leading-normal pt-1">
              Upload your transparent PNG store logo to lock it onto the video canvas and protect your engineered ad asset from other drop-shippers.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-md ${isRendering ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-black/5' : 'bg-black text-white hover:bg-blue-600 shadow-blue-600/10'}`}
            >
              {isRendering ? 'Processing...' : 'Bake Final Video'}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}