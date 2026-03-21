export type PlanName = 'free' | 'pro' | 'business'

export interface PlanLimits {
  plan: PlanName
  max_connections: number       // -1 = unlimited
  max_rows_per_month: number    // -1 = unlimited
  min_interval_minutes: number
  bidirectional_sync: boolean
  max_sync_runs_per_month: number // -1 = unlimited
  price_monthly_cents: number
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    plan: 'free',
    max_connections: 1,
    max_rows_per_month: 100,
    min_interval_minutes: 30,
    bidirectional_sync: false,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 0,
  },
  pro: {
    plan: 'pro',
    max_connections: 10,
    max_rows_per_month: 5000,
    min_interval_minutes: 5,
    bidirectional_sync: true,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 1900,
  },
  business: {
    plan: 'business',
    max_connections: -1,
    max_rows_per_month: 100000,
    min_interval_minutes: 1,
    bidirectional_sync: true,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 4900,
  },
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
