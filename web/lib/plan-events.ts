export const PLAN_UPDATED_EVENT = 'droplogic:plan-updated';
export const QUOTA_UPDATED_EVENT = 'droplogic:quota-updated';

export type PlanUpdatedDetail = {
  plan_status: string;
  user_tier?: string;
  appsumo_codes_count?: number;
};

export function notifyPlanUpdated(detail: PlanUpdatedDetail): void {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem('droplogic_plan_status', detail.plan_status.toLowerCase());
  if (detail.user_tier) {
    sessionStorage.setItem('droplogic_user_tier', detail.user_tier.toLowerCase());
  }
  if (typeof detail.appsumo_codes_count === 'number') {
    sessionStorage.setItem(
      'droplogic_appsumo_codes_count',
      String(detail.appsumo_codes_count),
    );
  }
  window.dispatchEvent(new CustomEvent<PlanUpdatedDetail>(PLAN_UPDATED_EVENT, { detail }));
}

export function notifyQuotaUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUOTA_UPDATED_EVENT));
}

