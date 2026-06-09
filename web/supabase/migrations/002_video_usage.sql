-- Video usage tracking and Pro plan support

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_status_check
  CHECK (plan_status IN ('free', 'pro', 'LTD', 'credits'));

CREATE TABLE IF NOT EXISTS public.video_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  email TEXT,
  job_id TEXT,
  product_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS video_usage_clerk_user_id_idx ON public.video_usage (clerk_user_id);
CREATE INDEX IF NOT EXISTS video_usage_created_at_idx ON public.video_usage (created_at DESC);
