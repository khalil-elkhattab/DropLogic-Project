export const PLAN_UPDATED_EVENT = 'droplogic:plan-updated';

export type PlanUpdatedDetail = {
  plan_status: string;
};

export function notifyPlanUpdated(detail: PlanUpdatedDetail): void {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem('droplogic_plan_status', detail.plan_status.toLowerCase());
  window.dispatchEvent(new CustomEvent<PlanUpdatedDetail>(PLAN_UPDATED_EVENT, { detail }));
}
