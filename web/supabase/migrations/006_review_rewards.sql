-- Review reward: AppSumo review proof → permanent monthly quota boost

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_reviewed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_proof TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_video_limit INTEGER;

CREATE INDEX IF NOT EXISTS profiles_has_reviewed_idx ON public.profiles (has_reviewed);
