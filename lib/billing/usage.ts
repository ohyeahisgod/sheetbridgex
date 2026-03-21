import { createClient } from '@/lib/supabase/server'
import { getLimits, currentMonth } from './plans'

export interface UsageStats {
  sync_runs: number
  rows_processed: number
  connections_used: number
  plan: string
}

/** Check if user can run a sync (row limit not exceeded). Returns error string or null. */
export async function checkSyncRunAllowed(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const [{ data: userData }, { data: usage }] = await Promise.all([
    supabase.from('users').select('plan').eq('id', userId).single(),
    supabase
      .from('usage_monthly')
      .select('rows_processed')
      .eq('user_id', userId)
      .eq('month', currentMonth())
      .single(),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  if (limits.max_rows_per_month === -1) return null

  const rowsUsed = usage?.rows_processed ?? 0
  if (rowsUsed >= limits.max_rows_per_month) {
    return `Monthly row limit reached (${rowsUsed}/${limits.max_rows_per_month}). Upgrade to continue syncing.`
  }

  return null
}

/** Check if user can create a new connection. Returns error string or null. */
export async function checkConnectionAllowed(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const [{ data: userData }, { count }] = await Promise.all([
    supabase.from('users').select('plan').eq('id', userId).single(),
    supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  if (limits.max_connections === -1) return null

  if ((count ?? 0) >= limits.max_connections) {
    return `Connection limit reached (${count}/${limits.max_connections}). Upgrade to add more syncs.`
  }

  return null
}

/** Check if user's plan supports bidirectional sync. Returns error string or null. */
export async function checkBidirectionalAllowed(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.from('users').select('plan').eq('id', userId).single()
  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  if (!limits.bidirectional_sync) {
    return 'Bidirectional sync requires Pro or Business plan. Upgrade to enable.'
  }
  return null
}

/**
 * Track a completed sync run. Inserts usage_record and atomically increments monthly summary.
 * Call this after a successful sync run.
 */
export async function trackSyncRun(
  userId: string,
  syncJobId: string,
  rowsProcessed: number
): Promise<void> {
  const supabase = await createClient()
  const month = currentMonth()

  await Promise.all([
    supabase.from('usage_records').insert({
      user_id: userId,
      sync_job_id: syncJobId,
      sync_runs: 1,
      rows_processed: rowsProcessed,
    }),
    supabase.rpc('increment_monthly_usage', {
      p_user_id: userId,
      p_month: month,
      p_sync_runs: 1,
      p_rows_processed: rowsProcessed,
    }),
  ])
}

/** Get current month usage stats for a user. */
export async function getMonthlyUsage(userId: string): Promise<UsageStats> {
  const supabase = await createClient()
  const month = currentMonth()

  const [{ data: userData }, { data: usage }, { count: connections }] = await Promise.all([
    supabase.from('users').select('plan').eq('id', userId).single(),
    supabase
      .from('usage_monthly')
      .select('sync_runs, rows_processed')
      .eq('user_id', userId)
      .eq('month', month)
      .single(),
    supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  return {
    sync_runs: usage?.sync_runs ?? 0,
    rows_processed: usage?.rows_processed ?? 0,
    connections_used: connections ?? 0,
    plan: userData?.plan ?? 'free',
  }
}
