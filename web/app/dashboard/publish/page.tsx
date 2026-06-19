"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { UserButton } from "@clerk/nextjs";

import DropLogicLogo from '@/components/brand/DropLogicLogo';
import TikTokPreviewOverlay from '@/components/publish/TikTokPreviewOverlay';
import ProxiedVideoPlayer from '@/components/results/ProxiedVideoPlayer';
import { buildBackendAssetUrl, getApiUrl, resolveBakedVideoUrl } from '@/lib/backend';
import { downloadVideoFile } from '@/lib/download';
import AppSumoJoyModal, { scheduleAppSumoJoyPrompt } from '@/components/review/AppSumoJoyModal';



function toMediaProxyUrl(absoluteUrl: string): string {

  return `/api/media?url=${encodeURIComponent(absoluteUrl)}`;

}



function SuccessPublishContent() {

  const router = useRouter();

  const searchParams = useSearchParams();



  const [sourceVideoUrl, setSourceVideoUrl] = useState<string>("");

  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [showTikTokOverlay, setShowTikTokOverlay] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const autoDownloadTriggered = useRef(false);



  const rawVideoUrl = searchParams.get('videoUrl') || "";

  const renderId = searchParams.get('renderId') || "";

  const incomingCaption = searchParams.get('caption') || "This viral Amazon gadget completely transformed my room! 🤫✨";

  const [showJoyModal, setShowJoyModal] = useState(false);
  const autoDownload = searchParams.get('autoDownload') === '1';
  const joyPrompt = searchParams.get('joyPrompt') === '1';



  useEffect(() => {

    let cancelled = false;



    async function resolveVideoAsset() {

      setIsLoading(true);

      setLoadError(null);



      let resolved = "";



      try {

        // 1. Prefer the exact URL passed from Studio after baking

        if (rawVideoUrl) {

          resolved = buildBackendAssetUrl(rawVideoUrl);

        }



        // 2. Build from render ID if only that was passed

        if (!resolved && renderId) {

          resolved = resolveBakedVideoUrl(renderId);



          const statusRes = await fetch(

            getApiUrl(`/api/video-studio/render-status/${encodeURIComponent(renderId)}`),

          );

          if (statusRes.ok) {

            const statusData = await statusRes.json();

            if (statusData.final_video_url) {

              resolved = statusData.final_video_url;

            }

          }

        }



        // 3. Fallback: newest fully baked asset on the server

        if (!resolved) {

          const assetsRes = await fetch(getApiUrl('/api/video-studio/published-assets'));

          if (assetsRes.ok) {

            const assetsData = await assetsRes.json();

            if (assetsData.success && assetsData.videos?.length > 0) {

              resolved = assetsData.videos[0].video_url;

            }

          }

        }



        if (cancelled) return;



        if (!resolved) {

          setLoadError('No baked video found yet. Return to Studio and bake your creative first.');

          setSourceVideoUrl("");

          setPreviewVideoUrl("");

          return;

        }



        setSourceVideoUrl(resolved);

        setPreviewVideoUrl(toMediaProxyUrl(resolved));

      } catch (err) {

        console.error('Failed to resolve baked video:', err);

        if (!cancelled) {

          setLoadError('Could not connect to the rendering server. Check your connection and try again.');

        }

      } finally {

        if (!cancelled) {

          setIsLoading(false);

        }

      }

    }



    resolveVideoAsset();

    return () => {

      cancelled = true;

    };

  }, [rawVideoUrl, renderId]);



  const aiAdData = {

    caption: incomingCaption,

    primaryText: incomingCaption.includes("Click the link")

      ? incomingCaption

      : `${incomingCaption} Our warehouse is clearing out inventory. This viral setup completely flips your late-night movie experience upside down. Get 50% OFF tonight only. Free Worldwide Shipping included!`,

    hashtags: "#dropshipping #viralproduct #tiktokmademebuyit #amazonfinds #roommakeover #ecommerce",

  };



  const handleCopy = (text: string, section: string) => {

    navigator.clipboard.writeText(text);

    setCopiedSection(section);

    setTimeout(() => setCopiedSection(null), 2000);

  };



  const handleDownload = async () => {
    if (!sourceVideoUrl) return;

    scheduleAppSumoJoyPrompt(() => setShowJoyModal(true));
    setIsDownloading(true);
    try {
      await downloadVideoFile(sourceVideoUrl);
    } catch (err) {
      console.error('Download error:', err);
      setLoadError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!autoDownload || !sourceVideoUrl || isLoading || autoDownloadTriggered.current) return;
    autoDownloadTriggered.current = true;
    void handleDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, sourceVideoUrl, isLoading]);

  useEffect(() => {
    if (!joyPrompt || isLoading || !sourceVideoUrl) return;
    if (sessionStorage.getItem('droplogic_pending_joy') === '1') {
      sessionStorage.removeItem('droplogic_pending_joy');
    }
    scheduleAppSumoJoyPrompt(() => setShowJoyModal(true));
  }, [joyPrompt, isLoading, sourceVideoUrl]);



  return (

    <div className="dl-page font-sans antialiased relative overflow-hidden flex flex-col h-screen">

      <div className="dl-grid-bg" />

      <nav className="dl-nav h-14 flex items-center justify-between px-6 sticky top-0 z-50 shrink-0 select-none">

        <div className="flex items-center gap-6">

          <DropLogicLogo href="/dashboard" size="sm" suffix="Studio" className="italic text-zinc-100" />

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/20">

            Asset Status:{' '}

            <span className="font-black animate-pulse">

              {isLoading ? 'SYNCING_ASSETS...' : loadError ? 'ERROR' : 'BAKED_&_READY'}

            </span>

          </div>

        </div>



        <div className="flex items-center gap-4">

          <button

            onClick={() => router.push('/dashboard/studio')}

            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"

          >

            ← Back to Studio

          </button>

          <UserButton afterSignOutUrl="/" />

        </div>

      </nav>



      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10 overflow-hidden">

        <section className="lg:col-span-5 bg-white/[0.02] p-6 flex flex-col justify-between items-center border-r border-white/[0.06] overflow-y-auto h-full">

          <div className="w-full text-left mb-4 shrink-0">

            <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block">

              // Master Output Monitor

            </span>

            <h1 className="text-sm font-black uppercase tracking-tight text-zinc-100">Your Engineered Creative</h1>

            <p className="text-[10px] text-zinc-500 mt-1">

              Voice, music, and video are baked into one file — preview before you download.

            </p>

          </div>



          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 gap-4">

            {isLoading && (

              <div className="w-full max-w-sm aspect-[9/16] rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">

                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">

                  Loading preview...

                </p>

              </div>

            )}



            {!isLoading && loadError && (

              <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">

                <p className="text-sm font-bold text-amber-200 mb-2">Preview unavailable</p>

                <p className="text-xs text-amber-200/80 leading-relaxed">{loadError}</p>

              </div>

            )}



            {!isLoading && previewVideoUrl && (
              <div className="w-full max-w-sm space-y-3">
                <div className="relative w-full max-w-sm aspect-[9/16] dl-video-frame rounded-lg overflow-hidden bg-black mx-auto">
                  <ProxiedVideoPlayer
                    key={previewVideoUrl}
                    src={previewVideoUrl}
                    fillFrame
                    variant="fill"
                    loop={false}
                    controls={!showTikTokOverlay}
                    muted={false}
                    preload="auto"
                    label="Baked ad preview"
                  />
                  {showTikTokOverlay && (
                    <TikTokPreviewOverlay caption={aiAdData.caption} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowTikTokOverlay((on) => !on)}
                  className={`w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-[0.99] ${
                    showTikTokOverlay
                      ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                      : 'dl-btn-secondary'
                  }`}
                >
                  {showTikTokOverlay ? '✓ TikTok Overlay On' : 'Toggle TikTok Overlay'}
                </button>

                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                  AI voice + background music embedded
                </p>
              </div>
            )}

          </div>



          <div className="w-full pt-4 border-t border-white/[0.06] mt-4 shrink-0">

            <button

              onClick={handleDownload}

              disabled={isLoading || !sourceVideoUrl || isDownloading}

              className="w-full h-12 dl-btn-primary rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"

            >

              {isDownloading ? 'Downloading...' : '⚡ Download High-Res Ad Video'}

            </button>

          </div>

        </section>



        <section className="lg:col-span-7 bg-[#09090b] p-6 space-y-6 overflow-y-auto h-full flex flex-col justify-between">

          <div className="space-y-6">

            <div>

              <div className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest mb-1">

                // Marketing Assets Copywriting

              </div>

              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">

                AI High-Conversion Copy Hub

              </h2>

              <p className="text-zinc-500 text-[11px] font-medium mt-1">

                Copy and paste these conversion-ready assets directly into Ad Managers.

              </p>

            </div>



            <div className="dl-glass p-4 space-y-2">

              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">

                <span>// Video Caption / Hook Title</span>

                <button

                  onClick={() => handleCopy(aiAdData.caption, 'caption')}

                  className="text-violet-400 hover:text-violet-300 transition font-bold"

                >

                  {copiedSection === 'caption' ? '✅ Copied!' : '📋 Copy Caption'}

                </button>

              </div>

              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-bold text-zinc-100 leading-relaxed">

                {aiAdData.caption}

              </div>

            </div>



            <div className="dl-glass p-4 space-y-2">

              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">

                <span>// Primary Ad Copy Text</span>

                <button

                  onClick={() => handleCopy(aiAdData.primaryText, 'body')}

                  className="text-violet-400 hover:text-violet-300 transition font-bold"

                >

                  {copiedSection === 'body' ? '✅ Copied Text!' : '📋 Copy Ad Body'}

                </button>

              </div>

              <div className="p-3.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-medium text-zinc-300 leading-relaxed max-h-[120px] overflow-y-auto">

                {aiAdData.primaryText}

              </div>

            </div>



            <div className="dl-glass p-4 space-y-2">

              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">

                <span>// Trending E-com Hashtags</span>

                <button

                  onClick={() => handleCopy(aiAdData.hashtags, 'tags')}

                  className="text-violet-400 hover:text-violet-300 transition font-bold"

                >

                  {copiedSection === 'tags' ? '✅ Copied Tags!' : '📋 Copy Tags'}

                </button>

              </div>

              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-mono font-bold text-violet-400 tracking-tight">

                {aiAdData.hashtags}

              </div>

            </div>

          </div>



          <div className="pt-4 border-t border-white/[0.06] mt-4 shrink-0 flex flex-col sm:flex-row gap-2">

            <button

              onClick={() => router.push('/dashboard/studio')}

              className="flex-1 h-11 dl-btn-secondary rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"

            >

              🔄 Create Another Video

            </button>

            <button

              onClick={() => router.push('/dashboard')}

              className="flex-1 h-11 dl-btn-primary rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"

            >

              🏁 Return to Dashboard

            </button>

          </div>

        </section>

      </main>

      <AppSumoJoyModal open={showJoyModal} onClose={() => setShowJoyModal(false)} />

    </div>

  );

}



export default function SuccessPublishPage() {

  return (

    <Suspense

      fallback={

        <div className="dl-page text-zinc-400 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">

          Loading Syncing Monitors...

        </div>

      }

    >

      <SuccessPublishContent />

    </Suspense>

  );

}

