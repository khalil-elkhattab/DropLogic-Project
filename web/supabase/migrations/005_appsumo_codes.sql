-- AppSumo lifetime-deal redemption codes (Phase 1)

CREATE TABLE IF NOT EXISTS public.appsumo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_by_user_id TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS appsumo_codes_code_idx ON public.appsumo_codes (code);
CREATE INDEX IF NOT EXISTS appsumo_codes_is_used_idx ON public.appsumo_codes (is_used);
