'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAppSumoDealUrl } from '@/lib/appsumo';
import { useVideoQuota } from '@/hooks/useVideoQuota';
import {
  ROADMAP_FEATURES,
  getVoteCounts,
  loadUserVotes,
  saveUserVote,
  type RoadmapFeature,
} from '@/lib/roadmap';

function ReviewGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const appsumoUrl = getAppSumoDealUrl();
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-w-md w-full dl-glass border border-violet-500/30 p-6 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-zinc-50">Review required to vote</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          To participate in voting and decide which feature we build next, support us by leaving a review
          on AppSumo!
        </p>
        <div className="flex flex-col gap-2">
          {appsumoUrl && (
            <a
              href={appsumoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 flex items-center justify-center rounded-xl dl-btn-primary text-[10px] font-black uppercase tracking-widest"
            >
              Review on AppSumo →
            </a>
          )}
          <button
            type="button"
            onClick={() => router.push('/activate-appsumo')}
            className="h-10 text-[10px] font-mono uppercase tracking-widest text-violet-300 hover:text-violet-200"
          >
            I have an AppSumo code
          </button>
          <button type="button" onClick={onClose} className="text-[10px] text-zinc-500 hover:text-zinc-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  votes,
  voted,
  onVote,
}: {
  feature: RoadmapFeature;
  votes: number;
  voted: boolean;
  onVote: (id: string) => void;
}) {
  return (
    <div className="dl-glass p-6 flex flex-col justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-zinc-100">{feature.title}</h3>
          <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
            {votes} votes
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
      </div>
      <button
        type="button"
        onClick={() => onVote(feature.id)}
        disabled={voted}
        className="h-10 rounded-xl border border-white/10 bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:border-violet-500/40 hover:text-violet-200 disabled:opacity-50 disabled:cursor-default"
      >
        {voted ? 'Vote recorded ✓' : 'Vote for this feature'}
      </button>
    </div>
  );
}

export default function RoadmapContent() {
  const { quota } = useVideoQuota();
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    setVoteCounts(getVoteCounts());
    setUserVotes(loadUserVotes());
  }, []);

  const handleVote = useCallback(
    (featureId: string) => {
      if (!quota?.has_reviewed) {
        setGateOpen(true);
        return;
      }

      const nextVotes = saveUserVote(featureId);
      setUserVotes(nextVotes);
      setVoteCounts(getVoteCounts());
    },
    [quota?.has_reviewed],
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 md:py-14 relative z-10">
      <div className="mb-10 space-y-3">
        <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block">
          // Product Roadmap
        </span>
        <h1 className="dl-section-title uppercase">You decide what ships next</h1>
        <p className="text-zinc-500 text-xs font-medium max-w-xl leading-relaxed">
          Vote on upcoming DropLogic features. Reviewed AppSumo supporters help steer the roadmap.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ROADMAP_FEATURES.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            votes={voteCounts[feature.id] ?? feature.votes}
            voted={userVotes.includes(feature.id)}
            onVote={handleVote}
          />
        ))}
      </div>

      <ReviewGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </main>
  );
}
