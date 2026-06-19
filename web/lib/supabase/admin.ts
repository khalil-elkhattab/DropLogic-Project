import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_VALUES = new Set([
  '',
  'undefined',
  'null',
  'none',
  'your-supabase-url',
  'your_project_url',
  'https://your-project.supabase.co',
]);

function cleanEnvValue(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Read Supabase URL from env only — never hardcoded.
 * Accepts SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string | null {
  const cleaned = cleanEnvValue(raw);
  if (!cleaned || PLACEHOLDER_VALUES.has(cleaned.toLowerCase())) {
    return null;
  }

  let candidate = cleaned.replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    const host = parsed.hostname;
    if (!host || !host.includes('.')) {
      return null;
    }

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function resolveSupabaseUrl(): string | null {
  return (
    normalizeSupabaseUrl(process.env.SUPABASE_URL) ||
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  );
}

function resolveServiceRoleKey(): string | null {
  const key =
    cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    cleanEnvValue(process.env.SUPABASE_SERVICE_KEY);

  if (!key || PLACEHOLDER_VALUES.has(key.toLowerCase())) {
    return null;
  }

  return key;
}

export function getSupabaseAdminConfig():
  | { url: string; serviceRoleKey: string }
  | { error: string } {
  const url = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();

  if (!url && !serviceRoleKey) {
    return {
      error: 'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
    };
  }

  if (!url) {
    return {
      error:
        'SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is missing or invalid. Expected https://<project-ref>.supabase.co',
    };
  }

  if (!serviceRoleKey) {
    return {
      error: 'SUPABASE_SERVICE_ROLE_KEY is missing or invalid.',
    };
  }

  return { url, serviceRoleKey };
}

export function createAdminClient() {
  const config = getSupabaseAdminConfig();

  if ('error' in config) {
    throw new Error(config.error);
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isSupabaseAdminConfigured(): boolean {
  return !('error' in getSupabaseAdminConfig());
}
