export type LemonSqueezyOrderItem = {
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name?: string;
};

export type LemonSqueezySubscriptionAttributes = {
  user_email: string;
  user_name?: string;
  status: string;
  product_id: number;
  variant_id: number;
  product_name?: string;
  variant_name?: string;
  updated_at?: string;
  ends_at?: string | null;
  cancelled?: boolean;
};

export type LemonSqueezyWebhookEvent = {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    type: string;
    id: string;
    attributes: LemonSqueezySubscriptionAttributes & {
      status?: string;
      first_order_item?: LemonSqueezyOrderItem;
    };
  };
};

export const SUBSCRIPTION_EVENTS = [
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
] as const;

export type SubscriptionEventName = (typeof SUBSCRIPTION_EVENTS)[number];

export const ORDER_EVENTS = ['order_created'] as const;
