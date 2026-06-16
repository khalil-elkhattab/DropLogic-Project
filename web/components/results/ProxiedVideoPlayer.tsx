'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ProxiedVideoPlayerProps = {
  src: string;
  /** Vertical TikTok/Reels frame (9:16) or fill parent container */
  variant?: 'vertical' | 'fill';
  /** When true, video is absolutely positioned to fill a positioned parent */
  fillFrame?: boolean;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  label?: string;
  onMouseEnterPlay?: boolean;
};

export default function ProxiedVideoPlayer({
  src,
  variant = 'vertical',
  fillFrame = false,
  className,
  autoPlay = false,
  muted = true,
  loop = true,
  controls = true,
  playsInline = true,
  preload = 'auto',
  label,
  onMouseEnterPlay = false,
}: ProxiedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wantsPlayRef = useRef(autoPlay);
  const userPausedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    wantsPlayRef.current = autoPlay;
    userPausedRef.current = !autoPlay;
  }, [autoPlay]);

  const tryResumePlayback = useCallback(() => {
    const el = videoRef.current;
    if (!el || userPausedRef.current || !wantsPlayRef.current) return;
    if (el.paused && !el.ended) {
      void el.play().catch(() => undefined);
    }
  }, []);

  const handleSeamlessLoop = useCallback(() => {
    const el = videoRef.current;
    if (!el || !loop || userPausedRef.current) return;
    el.currentTime = 0;
    void el.play().catch(() => undefined);
  }, [loop]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;

    setError(null);
    setIsBuffering(false);
    el.load();

    if (autoPlay) {
      wantsPlayRef.current = true;
      userPausedRef.current = false;
      const start = () => {
        void el.play().catch(() => undefined);
      };
      if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        start();
      } else {
        el.addEventListener('canplay', start, { once: true });
        return () => el.removeEventListener('canplay', start);
      }
    }
  }, [src, retryKey, autoPlay]);

  const handleError = useCallback(() => {
    setError(
      'This clip could not be loaded. TikTok CDN links expire quickly — run a fresh analysis to re-cache videos on the server.',
    );
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryKey((k) => k + 1);
  }, []);

  const videoClassName =
    className ??
    (fillFrame
      ? 'absolute inset-0 h-full w-full object-cover'
      : 'h-full w-full object-cover');

  const errorPanel = (
    <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 bg-zinc-950/90 p-5 text-center border border-white/10">
      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
        Preview unavailable
      </p>
      <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">{error}</p>
      <button
        type="button"
        onClick={handleRetry}
        className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300"
      >
        Retry load
      </button>
    </div>
  );

  const emptyPanel = (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-black/80 p-4 text-center">
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">No preview URL</p>
    </div>
  );

  const videoNode = !src ? (
    emptyPanel
  ) : error ? (
    errorPanel
  ) : (
  <>
    {isBuffering && (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/80 animate-pulse">
          Buffering…
        </span>
      </div>
    )}
    <video
      ref={videoRef}
      key={`${src}-${retryKey}`}
      src={src}
      className={videoClassName}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      aria-label={label}
      onError={handleError}
      onPlay={() => {
        wantsPlayRef.current = true;
        userPausedRef.current = false;
        setIsBuffering(false);
      }}
      onPause={() => {
        const el = videoRef.current;
        if (el && !el.ended) {
          userPausedRef.current = true;
          wantsPlayRef.current = false;
        }
      }}
      onWaiting={() => {
        setIsBuffering(true);
      }}
      onStalled={() => {
        setIsBuffering(true);
        tryResumePlayback();
      }}
      onCanPlay={() => {
        setIsBuffering(false);
        tryResumePlayback();
      }}
      onCanPlayThrough={() => {
        setIsBuffering(false);
        tryResumePlayback();
      }}
      onPlaying={() => {
        setIsBuffering(false);
      }}
      onEnded={loop ? handleSeamlessLoop : undefined}
      onTimeUpdate={() => {
        const el = videoRef.current;
        if (!el || userPausedRef.current || el.paused || el.ended) return;
        if (el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          setIsBuffering(true);
        }
      }}
      onMouseEnter={
        onMouseEnterPlay
          ? (e) => {
              userPausedRef.current = false;
              wantsPlayRef.current = true;
              void e.currentTarget.play().catch(() => undefined);
            }
          : undefined
      }
      onMouseLeave={
        onMouseEnterPlay
          ? (e) => {
              userPausedRef.current = true;
              wantsPlayRef.current = false;
              e.currentTarget.pause();
            }
          : undefined
      }
    />
  </>
  );

  if (variant === 'vertical' && !fillFrame) {
    return (
      <div className="relative mx-auto w-full max-w-[min(100%,340px)] aspect-[9/16] overflow-hidden rounded-2xl bg-black border border-white/10 shadow-[0_0_24px_rgba(139,92,246,0.12)]">
        {videoNode}
      </div>
    );
  }

  if (fillFrame) {
    return <div className="relative h-full w-full overflow-hidden bg-black">{videoNode}</div>;
  }

  return <div className="relative w-full overflow-hidden bg-black">{videoNode}</div>;
}
