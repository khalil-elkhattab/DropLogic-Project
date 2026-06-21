-- AppSumo code stacking: sync profiles.appsumo_codes_count from redeemed codes.
-- Tier quotas (enforced in backend usage_quota.py):
--   1 code  -> appsumo_tier1 -> 30 videos/month
--   2 codes -> appsumo_tier2 -> 100 videos/month
--   3+ codes -> appsumo_tier3 -> 600 videos/month (APPSUMO_TIER3_MONTHLY_VIDEO_LIMIT on backend)

CREATE OR REPLACE FUNCTION public.sync_appsumo_stack_for_user(p_clerk_user_id TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_tier TEXT;
  v_row public.profiles%ROWTYPE;
BEGIN
  IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
    RAISE EXCEPTION 'p_clerk_user_id is required';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.appsumo_codes
  WHERE is_used = TRUE
    AND used_by_user_id = p_clerk_user_id;

  v_tier := CASE
    WHEN v_count >= 3 THEN 'appsumo_tier3'
    WHEN v_count = 2 THEN 'appsumo_tier2'
    WHEN v_count >= 1 THEN 'appsumo_tier1'
    ELSE 'free'
  END;

  UPDATE public.profiles AS p
  SET
    appsumo_codes_count = v_count,
    user_tier = v_tier,
    plan_status = CASE WHEN v_count > 0 THEN 'LTD' ELSE p.plan_status END,
    updated_at = timezone('utc', now())
  WHERE p.clerk_user_id = p_clerk_user_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for clerk_user_id=%', p_clerk_user_id;
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.sync_appsumo_stack_for_user(TEXT) IS
  'Recompute AppSumo stack depth from appsumo_codes and update profiles.user_tier.';

-- One-time realignment for existing users.
UPDATE public.profiles AS p
SET
  appsumo_codes_count = sub.cnt,
  user_tier = CASE
    WHEN sub.cnt >= 3 THEN 'appsumo_tier3'
    WHEN sub.cnt = 2 THEN 'appsumo_tier2'
    WHEN sub.cnt >= 1 THEN 'appsumo_tier1'
    ELSE p.user_tier
  END,
  plan_status = CASE WHEN sub.cnt > 0 THEN 'LTD' ELSE p.plan_status END,
  updated_at = timezone('utc', now())
FROM (
  SELECT used_by_user_id, COUNT(*)::INTEGER AS cnt
  FROM public.appsumo_codes
  WHERE is_used = TRUE
    AND used_by_user_id IS NOT NULL
  GROUP BY used_by_user_id
) AS sub
WHERE p.clerk_user_id = sub.used_by_user_id;
