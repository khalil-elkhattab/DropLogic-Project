-- Lemon Squeezy subscription tracking on profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS profiles_lemon_subscription_idx
  ON public.profiles (lemon_squeezy_subscription_id);
