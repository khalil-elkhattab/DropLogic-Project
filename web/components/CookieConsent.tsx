'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'droplogic-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // Storage unavailable — still dismiss for this session
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 md:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto dl-glass shadow-[0_20px_60px_-15px_rgba(139,92,246,0.25)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p
            id="cookie-consent-title"
            className="text-sm font-bold text-zinc-100 mb-1"
          >
            We use cookies
          </p>
          <p
            id="cookie-consent-description"
            className="text-xs md:text-sm text-zinc-400 leading-relaxed"
          >
            DropLogic uses essential and analytics cookies to keep the platform secure, remember your
            preferences, and improve your experience. See our{' '}
            <Link
              href="/privacy"
              className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
            >
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="shrink-0 w-full sm:w-auto h-10 px-6 rounded-full dl-btn-primary text-xs uppercase tracking-widest active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
