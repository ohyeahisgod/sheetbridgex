import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLimits, currentMonth } from '@/lib/billing/plans'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = currentMonth()

  const [
    { data: userData },
    { data: usage },
    { count: connections },
    { data: subscription },
  ] = await Promise.all([
    supabase.from('users').select('plan').eq('id', user.id).single(),
    supabase
      .from('usage_monthly')
      .select('sync_runs, rows_processed')
      .eq('user_id', user.id)
      .eq('month', month)
      .single(),
    supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end, trial_end')
      .eq('user_id', user.id)
      .single(),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  return NextResponse.json({
    plan,
    month,
    limits: {
      max_connections: limits.max_connections,
      max_rows_per_month: limits.max_rows_per_month,
      min_interval_minutes: limits.min_interval_minutes,
      bidirectional_sync: limits.bidirectional_sync,
      price_monthly_cents: limits.price_monthly_cents,
    },
    usage: {
      sync_runs: usage?.sync_runs ?? 0,
      rows_processed: usage?.rows_processed ?? 0,
      connections_used: connections ?? 0,
    },
    subscription: subscription ?? null,
  })
}
