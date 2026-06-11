'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useRouter, useSearchParams } from 'next/navigation';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import NetProfitCard from '@/components/results/NetProfitCard';
import SalesTrendChart from '@/components/results/SalesTrendChart';
import ActiveCompetitorsTable from '@/components/results/ActiveCompetitorsTable';
import MetricTooltip from '@/components/results/MetricTooltip';
import type { AnalysisPayload, RawAsset } from '@/lib/analysis-types';
import type { ActiveCompetitor } from '@/components/results/ActiveCompetitorsTable';

// Same-origin paths — proxied to FastAPI via next.config.ts rewrites (no mixed content)
const RUN_ANALYSIS_API_URL = '/api/run-analysis';
const ANALYSIS_STATUS_API_URL = '/api/analysis-status';
const ANALYSIS_POLL_INTERVAL_MS = 2500;
const ANALYSIS_POLL_MAX_ATTEMPTS = 120; // ~5 minutes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollAnalysisUntilComplete(taskId: string): Promise<AnalysisPayload | null> {
  for (let attempt = 0; attempt < ANALYSIS_POLL_MAX_ATTEMPTS; attempt += 1) {
    const statusRes = await fetch(
      `${ANALYSIS_STATUS_API_URL}/${encodeURIComponent(taskId)}`,
      { cache: 'no-store' },
    );
    if (!statusRes.ok) {
      throw new Error(`Analysis status check failed (${statusRes.status})`);
    }

    const statusJson = await statusRes.json();
    if (statusJson.status === 'processing') {
      await sleep(ANALYSIS_POLL_INTERVAL_MS);
      continue;
    }

    if (statusJson.status === 'completed' || statusJson.status === 'failed') {
      const { task_id: _taskId, status: _status, keyword: _keyword, error: _error, ...payload } =
        statusJson;
      return payload as AnalysisPayload;
    }

    await sleep(ANALYSIS_POLL_INTERVAL_MS);
  }

  throw new Error('Analysis timed out while waiting for background job to finish.');
}

function proxyVideoUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  return `/api/proxy-video?url=${encodeURIComponent(originalUrl)}`;
}

function mapAsset(asset: RawAsset, index: number) {
  const originalUrl =
    asset.video_url || asset.videoUrl || asset.play || asset.wmplay || '';
  return {
    id: asset.id || `DL-ASSET-${index}`,
    title: asset.title || asset.desc || `Raw Asset # ${index + 1}`,
    duration: asset.duration || '0:15',
    video_url: proxyVideoUrl(originalUrl),
    platform: asset.platform || 'TikTok',
  };
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisPayload | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ReturnType<typeof mapAsset> | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || 'neck massager');

  const currentProductName = analysisData?.product_name || searchQuery;
  const analysisIdCode = analysisData?.analysis_id || '#DL-8892-X';

  const triggerLiveAnalysis = useCallback(async (keywordToSearch: string) => {
    if (!keywordToSearch) return;
    setLoading(true);
    try {
      const response = await fetch(RUN_ANALYSIS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordToSearch }),
        cache: 'no-store',
      });

      let jsonResult: AnalysisPayload;

      // 202 Accepted = job enqueued; poll until completed (each poll is a short GET).
      if (response.status === 202) {
        const accepted = await response.json();
        if (!accepted?.task_id) {
          throw new Error('Analysis accepted but no task_id returned from backend');
        }
        const polled = await pollAnalysisUntilComplete(accepted.task_id);
        if (!polled) return;
        jsonResult = polled;
      } else if (response.ok) {
        const body = await response.json();
        const { status: _status, cached: _cached, task_id: _taskId, ...payload } = body;
        jsonResult = payload as AnalysisPayload;
      } else {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `Analysis request failed (${response.status})${errBody ? `: ${errBody.slice(0, 200)}` : ''}`,
        );
      }

      setAnalysisData(jsonResult);

      const assetsList = jsonResult.raw_assets || jsonResult.assets || [];
      if (assetsList.length > 0) {
        setSelectedVideo(mapAsset(assetsList[0], 0));
      } else {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('[-] Connection failed to FastAPI Backend:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialQuery = searchParams.get('query') || searchQuery;
    triggerLiveAnalysis(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, triggerLiveAnalysis]);

  const handleLaunchStudio = () => {
    if (selectedVideo?.video_url) {
      const studioParams = new URLSearchParams({
        videoUrl: selectedVideo.video_url,
        title: selectedVideo.title || currentProductName,
        platform: selectedVideo.platform || 'TikTok',
      });
      router.push(`/dashboard/studio?${studioParams.toString()}`);
    } else {
      router.push(`/dashboard/studio?title=${encodeURIComponent(currentProductName)}`);
    }
  };

  const handleInspectStore = (url: string) => {
    if (!url) return;
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const competitors: ActiveCompetitor[] =
    analysisData?.active_competitors?.length
      ? analysisData.active_competitors
      : (analysisData?.intercepted_stores ?? []).map((store) => ({
          shop_name: store.shop_name ?? store.domain,
          shop_url: store.shop_url ?? `https://${store.domain}`,
          domain: store.domain,
          price: store.price,
          selling_price: store.selling_price,
          ad_platform: store.ad_platform ?? 'Unknown',
          active_ad_url: store.active_ad_url ?? null,
          spend: store.spend,
        }));

  const audiencePhrases =
    analysisData?.audience_phrases?.length
      ? analysisData.audience_phrases
      : ['No active audience trends returned from the neural pipeline yet.'];

  const fetchedAssets = analysisData?.raw_assets || analysisData?.assets || [];
  const rawAssets =
    fetchedAssets.length > 0
      ? fetchedAssets.map(mapAsset)
      : [
          {
            id: 'DL-EMPTY',
            title: `Scanning live assets for ${currentProductName}...`,
            duration: '0s',
            video_url: '',
            platform: 'System',
          },
        ];

  const logicScore = Number(analysisData?.metrics?.logic_score ?? 0);

  const kpiMetrics = [
    {
      label: 'Logic Score',
      value: analysisData?.metrics?.logic_score
        ? Number(analysisData.metrics.logic_score).toFixed(1)
        : '0.0',
      sub: logicScore >= 8.5 ? 'Highly Optimistic' : 'Moderate Growth',
      tip: 'Composite viability score from demand signals, margin potential, and creative saturation.',
    },
    {
      label: 'Audience Sentiment',
      value: analysisData?.metrics?.sentiment || '0%',
      sub: 'Positive Resonance',
      tip: 'Share of social comments and reviews expressing purchase intent or satisfaction.',
    },
    {
      label: 'Saturation Index',
      value: analysisData?.metrics?.saturation || 'Fetching...',
      sub: 'Room for Scale',
      tip: 'How crowded the niche is — Low/Medium leaves more room to scale paid traffic.',
    },
    {
      label: 'Net Margin',
      value: analysisData?.financials
        ? `${analysisData.financials.net_profit_margin_pct.toFixed(1)}%`
        : analysisData?.metrics?.net_margin || '0%',
      sub: 'After COGS + Ads',
      tip: 'Estimated take-home margin after supplier cost and 30% ad spend reserve.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <nav className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <DropLogicLogo href="/dashboard" size="md" className="italic [&_span]:text-white" />
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 px-3 py-1 rounded border border-white/10">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Analysis_ID: {analysisIdCode}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-r border-white/10 pr-6">
            <div>
              Market: <span className="text-white">{analysisData?.market || 'US'}</span>
            </div>
            <div>
              Currency: <span className="text-white">USD</span>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-10 pb-24 px-6 md:px-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-8">
          <div className="w-full md:max-w-xl space-y-4">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-[0.3em]">
              {loading ? '// Extruding neural pipeline vectors...' : '// Product intelligence report'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white capitalize leading-none">
              {currentProductName}{' '}
              <span className="text-zinc-600 font-sans not-italic">.report</span>
            </h1>
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter product to analyze..."
                className="h-10 border border-white/10 rounded-xl px-4 text-xs font-bold bg-zinc-900 focus:outline-none focus:border-emerald-500/50 w-full text-white placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => triggerLiveAnalysis(searchQuery)}
                disabled={loading}
                className="h-10 bg-emerald-600 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-all disabled:opacity-50 active:scale-[0.97] shadow-[0_0_24px_-8px_rgba(52,211,153,0.8)]"
              >
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-wider gap-1 self-start md:self-end">
            {['intelligence', 'competitors', 'sentiment', 'video studio'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced financials + trend */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <NetProfitCard financials={analysisData?.financials ?? null} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            {analysisData?.sales_trend ? (
              <SalesTrendChart
                points={analysisData.sales_trend.points}
                direction={analysisData.sales_trend.direction}
                deltaPct={analysisData.sales_trend.delta_pct}
              />
            ) : (
              <div className="h-full min-h-[220px] rounded-2xl border border-white/10 bg-zinc-900/60 p-5 flex items-center justify-center text-xs font-mono text-zinc-500">
                {loading ? 'Building sales trend...' : 'No trend data'}
              </div>
            )}
          </div>
        </section>

        {/* KPI bricks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {kpiMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-sm transition hover:border-emerald-500/25 hover:bg-zinc-900/80"
            >
              <MetricTooltip label={metric.label} tip={metric.tip} />
              <div className="mt-3 text-3xl font-black tracking-tight text-white">{metric.value}</div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight mt-1">
                {metric.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'intelligence' && (
              <>
                <ActiveCompetitorsTable
                  competitors={competitors}
                  loading={loading}
                  onInspectStore={handleInspectStore}
                />

                <div className="p-6 border border-white/10 rounded-2xl bg-zinc-900/50">
                  <MetricTooltip
                    label="Recommended Angle"
                    tip="Positioning advice based on saturation — differentiation beats feature dumps in crowded niches."
                  />
                  <div className="mt-4 text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
                    {analysisData?.metrics?.saturation === 'High' ? (
                      <>
                        High market density. Sell the{' '}
                        <span className="text-emerald-400 italic">premium differentiation</span>.
                      </>
                    ) : (
                      <>
                        Stop focusing on tech specs. Sell the{' '}
                        <span className="text-zinc-500 italic">mental escape</span>.
                      </>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs font-medium max-w-xl mt-3">
                    Native hooks and problem-first creatives scale campaigns up to 4.2× more efficiently
                    in this category.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'competitors' && (
              <ActiveCompetitorsTable
                competitors={competitors}
                loading={loading}
                onInspectStore={handleInspectStore}
              />
            )}

            {activeTab === 'sentiment' && (
              <div className="space-y-4">
                <MetricTooltip
                  label="Audience Phrases"
                  tip="Verbatim hooks and comments mined from TikTok/Meta — reuse these in your scripts."
                />
                {audiencePhrases.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-white/10 rounded-xl font-medium text-xs flex gap-4 items-center bg-zinc-900/40 hover:border-emerald-500/20 transition"
                  >
                    <span className="font-mono text-zinc-600">0{idx + 1}</span>
                    <p className="text-zinc-200 italic">&ldquo;{phrase}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'video studio' && (
              <div className="p-8 border border-white/10 bg-zinc-900/50 rounded-2xl space-y-6">
                <div>
                  <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-[0.3em] mb-2">
                    // Creative Deployment Pipeline
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-white italic">Raw Ads Captured</h3>
                  <p className="text-zinc-500 text-xs font-medium mt-1 max-w-xl">
                    Highest-performing raw video assets for this product. Click a card to preview in the
                    focus stream, then launch Studio.
                  </p>
                </div>

                {selectedVideo && selectedVideo.video_url && selectedVideo.id !== 'DL-EMPTY' && (
                  <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video relative border border-white/10 shadow-2xl">
                    <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold text-white px-3 py-1 rounded-full uppercase tracking-widest">
                      Active: {selectedVideo.title}
                    </div>
                    <video
                      key={selectedVideo.id}
                      src={selectedVideo.video_url}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {rawAssets
                    .filter((v) => v.id !== 'DL-EMPTY')
                    .map((video) => {
                      const isSelected = selectedVideo?.id === video.id;
                      const hasValidVideo = Boolean(video.video_url);
                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => hasValidVideo && setSelectedVideo(video)}
                          disabled={!hasValidVideo}
                          className={`border rounded-xl p-4 flex flex-col gap-3 text-left transition-all ${
                            hasValidVideo ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                          } ${
                            isSelected
                              ? 'border-emerald-500/50 bg-emerald-500/5'
                              : 'border-white/10 bg-zinc-900/40 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-mono text-[9px] font-black">
                                {video.platform.toUpperCase().substring(0, 4)}
                              </div>
                              <div className="max-w-[150px] sm:max-w-[180px]">
                                <p className="text-xs font-bold text-white truncate">{video.title}</p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
                                  {video.duration}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                                isSelected
                                  ? 'text-emerald-300 bg-emerald-500/15'
                                  : 'text-zinc-400 bg-zinc-800'
                              }`}
                            >
                              {isSelected ? 'Selected' : hasValidVideo ? 'Ready' : 'Empty'}
                            </span>
                          </div>
                          {hasValidVideo && (
                            <div className="w-full rounded-lg overflow-hidden bg-black aspect-video">
                              <video
                                src={video.video_url}
                                muted
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover pointer-events-none"
                                onMouseEnter={(e) => {
                                  e.currentTarget.play().catch(() => undefined);
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.pause();
                                }}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleLaunchStudio}
                    disabled={!selectedVideo || selectedVideo.id === 'DL-EMPTY'}
                    className="w-full sm:w-auto h-12 bg-emerald-600 text-white px-8 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-40 shadow-[0_0_30px_-10px_rgba(52,211,153,0.9)]"
                  >
                    Launch Studio ({selectedVideo?.platform || 'Select Asset'}) →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black text-white p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                Decision Cluster
              </div>
              <div className="inline-block bg-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-6">
                System Recommendation
              </div>
              <h3 className="text-2xl font-bold tracking-tight italic leading-tight mb-4">
                {logicScore >= 8.2 ? (
                  <>
                    Green Light.
                    <br />
                    Deploy Campaign.
                  </>
                ) : (
                  <>
                    Hold Pipeline.
                    <br />
                    Awaiting Signals.
                  </>
                )}
              </h3>
              <p className="text-zinc-400 text-xs font-medium leading-relaxed mb-6">
                Viability margin at{' '}
                {analysisData?.financials
                  ? `${analysisData.financials.net_profit_margin_pct.toFixed(1)}%`
                  : analysisData?.metrics?.net_margin || '0%'}
                . {analysisData?.sales_trend?.direction === 'scaling' ? 'Volume is scaling — move fast.' : 'Watch trend before scaling spend.'}
              </p>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">
                <span>Confidence</span>
                <span className="text-emerald-400">
                  {analysisData?.metrics?.logic_score
                    ? `${(Number(analysisData.metrics.logic_score) * 10.3).toFixed(1)}%`
                    : '0.0%'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-14 border border-white/15 bg-transparent text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all active:scale-[0.98]"
            >
              Export Logic Blueprint
            </button>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-[0.2em]">
          <span>© 2026 DropLogic Labs</span>
          <span className="text-emerald-500/70">Pipeline: Stable_Secure_SSL</span>
        </div>
      </main>
    </div>
  );
}

export default function DashboardResults() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-zinc-400 font-mono flex items-center justify-center text-xs">
          // Loading analysis pipeline...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
