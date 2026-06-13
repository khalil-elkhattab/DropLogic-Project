'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/clerk-react';
import DropLogicLogo from '@/components/brand/DropLogicLogo';
import { isAllowedBackendUrl } from '@/lib/backend';

type GeneratedAd = {
  id: string;
  user_id: string;
  product_name: string;
  selected_hook: string;
  video_url: string;
  created_at: string;
};

function toMediaProxyUrl(absoluteUrl: string): string {
  return `/api/media?url=${encodeURIComponent(absoluteUrl)}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdHistoryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [ads, setAds] = useState<GeneratedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ads/history', { cache: 'no-store' });
      if (response.status === 401) {
        setError('Sign in to view your ad history.');
        setAds([]);
        return;
      }
      if (!response.ok) {
        throw new Error('Could not load ad history');
      }
      const data = await response.json();
      setAds(Array.isArray(data.ads) ? data.ads : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadHistory();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
      setError('Sign in to view your ad history.');
    }
  }, [isLoaded, isSignedIn, loadHistory]);

  const handleDownload = async (ad: GeneratedAd) => {
    if (!isAllowedBackendUrl(ad.video_url)) return;

    setDownloadingId(ad.id);
    try {
      const filename = `droplogic-${ad.product_name.replace(/\s+/g, '-').toLowerCase()}-${ad.id.slice(0, 8)}.mp4`;
      const downloadUrl = `/api/download?url=${encodeURIComponent(ad.video_url)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError('Download failed. The file may no longer be on the server.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="dl-page dl-page-elevated font-sans antialiased relative overflow-hidden">
      <div className="dl-grid-bg" />

      <nav className="dl-nav h-16 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-6">
          <DropLogicLogo href="/dashboard" size="md" className="italic text-zinc-100" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 border-b-2 border-violet-500 pb-1">
            Ad History
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/studio')}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-violet-300 transition"
          >
            + New Ad
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <header className="mb-10">
          <p className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-[0.3em] mb-2">
            // Your Library
          </p>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-zinc-50">
            Generated Ads
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl">
            Preview and re-download every video you have baked. History is tied to your account.
          </p>
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] aspect-[9/16] animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center max-w-lg mx-auto">
            <p className="text-sm font-bold text-amber-200 mb-1">Unable to load history</p>
            <p className="text-xs text-amber-200/80">{error}</p>
          </div>
        )}

        {!isLoading && !error && ads.length === 0 && (
          <div className="dl-glass p-10 text-center max-w-lg mx-auto">
            <p className="text-sm font-bold mb-2 text-zinc-100">No ads yet</p>
            <p className="text-xs text-zinc-500 mb-6">
              Bake your first video in Studio — it will appear here automatically.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/studio')}
              className="h-11 px-6 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest"
            >
              Open Studio →
            </button>
          </div>
        )}

        {!isLoading && !error && ads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <article
                key={ad.id}
                className="dl-glass overflow-hidden hover:border-violet-500/30 transition group"
              >
                <div className="relative aspect-[9/16] bg-black">
                  {isAllowedBackendUrl(ad.video_url) ? (
                    <video
                      src={toMediaProxyUrl(ad.video_url)}
                      controls
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-gray-500 uppercase">
                      Preview unavailable
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight line-clamp-1 text-zinc-100">
                      {ad.product_name}
                    </h2>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">
                      {formatDate(ad.created_at)}
                    </p>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 italic">
                    &ldquo;{ad.selected_hook}&rdquo;
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDownload(ad)}
                    disabled={downloadingId === ad.id || !isAllowedBackendUrl(ad.video_url)}
                    className="w-full h-10 rounded-xl dl-btn-primary text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === ad.id ? 'Downloading...' : '⚡ Download'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
