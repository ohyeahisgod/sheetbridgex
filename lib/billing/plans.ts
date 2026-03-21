export type PlanName = 'free' | 'starter' | 'pro' | 'business'

export interface PlanLimits {
  plan: PlanName
  label: string
  max_connections: number       // -1 = unlimited
  max_rows_per_month: number    // -1 = unlimited
  min_interval_minutes: number
  bidirectional_sync: boolean
  max_sync_runs_per_month: number // -1 = unlimited
  price_monthly_cents: number
  stripe_price_id: string | null  // null = free
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    plan: 'free',
    label: 'Free',
    max_connections: 1,
    max_rows_per_month: 100,
    min_interval_minutes: 30,
    bidirectional_sync: false,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 0,
    stripe_price_id: null,
  },
  starter: {
    plan: 'starter',
    label: 'Starter',
    max_connections: 3,
    max_rows_per_month: 1000,
    min_interval_minutes: 15,
    bidirectional_sync: false,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 900,
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID ?? 'price_1TDNhPGfOC22jA4iEvo6dWMf',
  },
  pro: {
    plan: 'pro',
    label: 'Pro',
    max_connections: 10,
    max_rows_per_month: 5000,
    min_interval_minutes: 5,
    bidirectional_sync: true,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 1900,
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID ?? 'price_1TDNhRGfOC22jA4iqvFaLGi5',
  },
  business: {
    plan: 'business',
    label: 'Business',
    max_connections: -1,
    max_rows_per_month: 100000,
    min_interval_minutes: 1,
    bidirectional_sync: true,
    max_sync_runs_per_month: -1,
    price_monthly_cents: 4900,
    stripe_price_id: process.env.STRIPE_BUSINESS_PRICE_ID ?? 'price_1TDNhSGfOC22jA4i5LKK2iNg',
  },
}

/** Map a Stripe price ID → plan name */
export const PRICE_TO_PLAN: Record<string, PlanName> = Object.fromEntries(
  Object.values(PLAN_LIMITS)
    .filter(p => p.stripe_price_id)
    .map(p => [p.stripe_price_id!, p.plan])
)

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
