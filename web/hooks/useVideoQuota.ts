'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { VideoQuota } from '@/lib/quota';
import { PLAN_UPDATED_EVENT, QUOTA_UPDATED_EVENT } from '@/lib/plan-events';

export function useVideoQuota() {
  const { user, isLoaded } = useUser();
  const [quota, setQuota] = useState<VideoQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setQuota(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/video-studio/usage', { cache: 'no-store' });
      if (response.ok) {
        const data: VideoQuota = await response.json();
        setQuota(data);
      }
    } catch (error) {
      console.error('[-] Failed to load video quota:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      void refresh();
    }
  }, [isLoaded, refresh]);

  useEffect(() => {
    const handleUpdate = () => {
      void refresh();
    };

    window.addEventListener(PLAN_UPDATED_EVENT, handleUpdate);
    window.addEventListener(QUOTA_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PLAN_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(QUOTA_UPDATED_EVENT, handleUpdate);
    };
  }, [refresh]);

  return { quota, loading, refresh };
}
