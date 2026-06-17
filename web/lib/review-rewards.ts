export type ReviewProofResponse = {
  success: boolean;
  message: string;
  has_reviewed: boolean;
  monthly_video_limit?: number;
  limit: number;
  used: number;
  remaining: number;
  plan_status: string;
  period: string;
};

export async function submitReviewProof(proof: string): Promise<ReviewProofResponse> {
  const response = await fetch('/api/submit-review-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proof: proof.trim() }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (payload as { detail?: string }).detail ||
      (payload as { error?: string }).error ||
      'Could not claim review upgrade.';
    throw new Error(message);
  }

  return payload as ReviewProofResponse;
}

export function shouldShowReviewBanner(quota: {
  period?: string;
  plan_status?: string;
  has_reviewed?: boolean;
} | null): boolean {
  if (!quota || quota.has_reviewed) return false;
  const plan = (quota.plan_status || 'free').toLowerCase();
  return plan === 'pro' || plan === 'ltd' || quota.period === 'monthly';
}
