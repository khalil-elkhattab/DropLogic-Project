export type RoadmapFeature = {
  id: string;
  title: string;
  description: string;
  votes: number;
};

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    id: 'ai-auto-subtitles',
    title: 'AI Auto-Subtitles',
    description: 'Burn TikTok-native captions automatically synced to your AI voiceover.',
    votes: 128,
  },
  {
    id: 'advanced-bulk-proxies',
    title: 'Advanced Bulk Proxies',
    description: 'Rotate residential proxies for high-volume scraping without rate limits.',
    votes: 94,
  },
  {
    id: 'ultra-fast-rendering',
    title: 'Ultra-Fast Rendering',
    description: 'Priority GPU queue for sub-30s vertical ad exports at scale.',
    votes: 156,
  },
];

const VOTES_STORAGE_KEY = 'droplogic_roadmap_votes';

export function loadUserVotes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveUserVote(featureId: string): string[] {
  const existing = loadUserVotes();
  if (existing.includes(featureId)) return existing;
  const next = [...existing, featureId];
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getVoteCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const feature of ROADMAP_FEATURES) {
    counts[feature.id] = feature.votes;
  }

  if (typeof window === 'undefined') return counts;

  const userVotes = loadUserVotes();
  for (const featureId of userVotes) {
    counts[featureId] = (counts[featureId] || 0) + 1;
  }

  return counts;
}
