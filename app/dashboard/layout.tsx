import { Sidebar } from '@/components/dashboard/sidebar'
import { createClient } from '@/lib/supabase/server'
import { getLimits, currentMonth } from '@/lib/billing/plans'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: userData },
    { count: connections },
    { data: usage },
  ] = await Promise.all([
    supabase.from('users').select('plan').eq('id', user.id).single(),
    supabase.from('sync_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('usage_monthly').select('rows_processed').eq('user_id', user.id).eq('month', currentMonth()).single(),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  const planSummary = {
    plan,
    label: limits.label,
    connectionsUsed: connections ?? 0,
    maxConnections: limits.max_connections,
    rowsProcessed: usage?.rows_processed ?? 0,
    maxRows: limits.max_rows_per_month,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar planSummary={planSummary} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
