-- Generated ad history per user (Clerk user_id stored as user_id)

CREATE TABLE IF NOT EXISTS public.generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  selected_hook TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS generated_ads_user_id_idx ON public.generated_ads (user_id);
CREATE INDEX IF NOT EXISTS generated_ads_created_at_idx ON public.generated_ads (created_at DESC);
