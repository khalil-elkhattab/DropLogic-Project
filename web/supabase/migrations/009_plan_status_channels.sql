-- Distinct purchase channels: Lemon monthly, Lemon LTD, AppSumo code redemption.
-- Legacy values (free, pro, LTD, credits) remain valid for backward compatibility.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_status_check
  CHECK (plan_status IN (
    'free',
    'pro',
    'Pro_Monthly',
    'LTD',
    'LTD_Direct',
    'LTD_AppSumo',
    'credits'
  ));

-- Backfill channel-specific statuses from existing data.
UPDATE public.profiles
SET plan_status = 'Pro_Monthly'
WHERE LOWER(plan_status) = 'pro';

UPDATE public.profiles
SET plan_status = 'LTD_AppSumo'
WHERE appsumo_codes_count > 0
   OR user_tier IN ('appsumo_tier1', 'appsumo_tier2', 'appsumo_tier3');

UPDATE public.profiles
SET plan_status = 'LTD_Direct'
WHERE plan_status = 'LTD'
  AND (appsumo_codes_count IS NULL OR appsumo_codes_count = 0)
  AND user_tier NOT IN ('appsumo_tier1', 'appsumo_tier2', 'appsumo_tier3');
