-- AppSumo stack depth + unified user tier for bake quota limits.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS appsumo_codes_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_tier_check
  CHECK (user_tier IN (
    'free',
    'premium',
    'appsumo_tier1',
    'appsumo_tier2',
    'appsumo_tier3'
  ));

-- Backfill AppSumo code counts from redeemed rows.
UPDATE public.profiles AS p
SET appsumo_codes_count = sub.cnt
FROM (
  SELECT used_by_user_id, COUNT(*)::INTEGER AS cnt
  FROM public.appsumo_codes
  WHERE is_used = TRUE
    AND used_by_user_id IS NOT NULL
  GROUP BY used_by_user_id
) AS sub
WHERE p.clerk_user_id = sub.used_by_user_id;

-- Derive user_tier from stack depth and legacy plan_status.
UPDATE public.profiles
SET user_tier = CASE
  WHEN appsumo_codes_count >= 3 THEN 'appsumo_tier3'
  WHEN appsumo_codes_count = 2 THEN 'appsumo_tier2'
  WHEN appsumo_codes_count >= 1 THEN 'appsumo_tier1'
  WHEN LOWER(plan_status) IN ('pro', 'credits') THEN 'premium'
  WHEN LOWER(plan_status) = 'ltd' THEN 'appsumo_tier1'
  ELSE 'free'
END
WHERE user_tier = 'free' OR user_tier IS NULL;
