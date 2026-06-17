'use client';

import { getAppSumoDealUrl } from '@/lib/appsumo';

const JOY_MODAL_SESSION_KEY = 'droplogic_joy_modal_shown';

export function scheduleAppSumoJoyPrompt(onShow: () => void): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(JOY_MODAL_SESSION_KEY) === '1') return;

  window.setTimeout(() => {
    sessionStorage.setItem(JOY_MODAL_SESSION_KEY, '1');
    onShow();
  }, 2000);
}

type AppSumoJoyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AppSumoJoyModal({ open, onClose }: AppSumoJoyModalProps) {
  const appsumoUrl = getAppSumoDealUrl();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md dl-glass border border-violet-500/35 p-8 text-center shadow-[0_30px_80px_-20px_rgba(139,92,246,0.5)]"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 border border-violet-400/30 text-2xl animate-bounce">
          🥳
        </div>
        <h2 className="text-lg font-black uppercase tracking-tight text-zinc-50 mb-3">
          Saved you hours of editing!
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-6">
          Happy with the result? Drop us <span className="text-amber-300 font-bold">5 Tacos</span> on
          AppSumo to keep us going!
        </p>

        {appsumoUrl ? (
          <a
            href={appsumoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full h-12 items-center justify-center rounded-xl dl-btn-primary text-[10px] font-black uppercase tracking-widest"
          >
            Leave 5 Tacos on AppSumo →
          </a>
        ) : (
          <p className="text-xs text-zinc-500">AppSumo link coming soon.</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
