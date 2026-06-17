export type AppSumoActivateResponse = {
  success: boolean;
  message: string;
  code: string;
  plan_status: string;
  lifetime_plan: boolean;
  redeemed_at?: string | null;
  clerk_user_id: string;
};

export type AppSumoActivateErrorBody = {
  detail?: string;
  error?: string;
};

const CODE_PATTERN = /^DROPLOGIC-AS-[A-Z0-9]{5}$/;

export function normalizeAppSumoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidAppSumoCodeFormat(code: string): boolean {
  return CODE_PATTERN.test(normalizeAppSumoCode(code));
}

export function getAppSumoDealUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_APPSUMO_DEAL_URL?.trim();
  return url || null;
}

export async function activateAppSumoCode(code: string): Promise<AppSumoActivateResponse> {
  const normalized = normalizeAppSumoCode(code);

  const response = await fetch('/api/activate-appsumo-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: normalized }),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as
    | AppSumoActivateResponse
    | AppSumoActivateErrorBody;

  if (!response.ok) {
    const message =
      (payload as AppSumoActivateErrorBody).detail ||
      (payload as AppSumoActivateErrorBody).error ||
      'Could not activate this AppSumo code. Please try again.';
    throw new Error(message);
  }

  return payload as AppSumoActivateResponse;
}

export function mapAppSumoErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Activation failed. Please try again.';

  if (/already been redeemed/i.test(message)) {
    return 'This code has already been used.';
  }
  if (/invalid appsumo code/i.test(message) || /not found/i.test(message)) {
    return 'Invalid code. Please check your AppSumo code and try again.';
  }
  if (/invalid code format/i.test(message)) {
    return 'Invalid format. Codes look like DROPLOGIC-AS-XXXXX.';
  }
  if (/unauthorized/i.test(message)) {
    return 'Please sign in before activating your code.';
  }

  return message;
}
