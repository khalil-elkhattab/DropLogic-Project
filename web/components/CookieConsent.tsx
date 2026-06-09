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
      <div className="max-w-4xl mx-auto pointer-events-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p
            id="cookie-consent-title"
            className="text-sm font-bold text-black dark:text-white mb-1"
          >
            We use cookies
          </p>
          <p
            id="cookie-consent-description"
            className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
          >
            DropLogic uses essential and analytics cookies to keep the platform secure, remember your
            preferences, and improve your experience. See our{' '}
            <Link
              href="/privacy"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="shrink-0 w-full sm:w-auto h-10 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141414]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
