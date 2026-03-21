import { createClient } from '@/lib/supabase/server'
import { getLimits, currentMonth } from '@/lib/billing/plans'
import { SyncJob } from '@/lib/types'
import { PlanBanner } from '@/components/dashboard/plan-banner'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { CheckCircle } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const [
    { data: jobs },
    { data: userData },
    { count: connections },
    { data: usage },
  ] = await Promise.all([
    supabase.from('sync_jobs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('users').select('plan').eq('id', user!.id).single(),
    supabase.from('sync_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('usage_monthly').select('rows_processed').eq('user_id', user!.id).eq('month', currentMonth()).single(),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)
  const connectionsUsed = connections ?? 0
  const rowsProcessed = usage?.rows_processed ?? 0

  return (
    <div className="px-8 py-8 max-w-5xl">

      {/* Post-checkout success toast */}
      {params?.success === 'true' && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          Plan upgraded successfully — your new limits are now active.
        </div>
      )}

      {/* Plan & Usage Banner */}
      <PlanBanner
        plan={plan}
        limits={limits}
        connectionsUsed={connectionsUsed}
        rowsProcessed={rowsProcessed}
      />

      {/* Sync list with interactive header + upgrade modal */}
      <DashboardShell
        jobs={(jobs ?? []) as SyncJob[]}
        plan={plan}
        limits={limits}
        connectionsUsed={connectionsUsed}
      />

    </div>
  )
}
