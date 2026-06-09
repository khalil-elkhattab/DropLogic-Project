'use client';

import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react';

type TikTokPreviewOverlayProps = {
  username?: string;
  caption: string;
};

export default function TikTokPreviewOverlay({
  username = '@droplogic.finds',
  caption,
}: TikTokPreviewOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Top gradient for depth */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {/* Right interaction rail */}
      <div className="absolute right-2 sm:right-3 bottom-[28%] flex flex-col items-center gap-4 sm:gap-5">
        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white fill-white/90" strokeWidth={1.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-md">24.8K</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" strokeWidth={1.75} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-md">892</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" strokeWidth={1.75} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-white drop-shadow-md">Share</span>
        </div>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black border border-white/20 flex items-center justify-center animate-[spin_4s_linear_infinite] shadow-lg mt-1">
          <Music2 className="w-4 h-4 text-white/90" strokeWidth={2} />
        </div>
      </div>

      {/* Bottom caption + CTA */}
      <div className="relative z-10 p-3 sm:p-4 pr-14 sm:pr-16 pb-3 sm:pb-4 w-full">
        <p className="text-[11px] sm:text-xs font-bold text-white drop-shadow-lg mb-1">
          {username}
        </p>
        <p className="text-[10px] sm:text-[11px] text-white/95 leading-snug line-clamp-3 drop-shadow-md mb-3 max-w-[85%]">
          {caption}
        </p>
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center justify-center px-4 py-2 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white bg-[#fe2c55] shadow-[0_0_18px_rgba(254,44,85,0.65)] border border-white/20 hover:brightness-110 transition"
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}
