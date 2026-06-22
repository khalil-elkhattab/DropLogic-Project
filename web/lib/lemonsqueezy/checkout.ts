type CheckoutOptions = {
  email?: string;
  clerkUserId?: string;
};

function appendCheckoutParams(url: URL, options?: CheckoutOptions): string {
  if (options?.email) {
    url.searchParams.set('checkout[email]', options.email);
  }

  if (options?.clerkUserId) {
    url.searchParams.set('checkout[custom][clerk_user_id]', options.clerkUserId);
  }

  return url.toString();
}

export function getLtdCheckoutUrl(options?: CheckoutOptions): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_LTD_CHECKOUT_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  return appendCheckoutParams(new URL(baseUrl), options);
}

export function getProCheckoutUrl(options?: CheckoutOptions): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_CHECKOUT_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  return appendCheckoutParams(new URL(baseUrl), options);
}

export function isProCheckoutConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_CHECKOUT_URL?.trim());
}

export function isLtdCheckoutConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_LEMONSQUEEZY_LTD_CHECKOUT_URL?.trim());
}
