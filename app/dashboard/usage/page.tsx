import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function UsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const { count: syncCount } = await supabase
    .from('sync_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: logCount } = await supabase
    .from('sync_logs')
    .select('sync_job_id, sync_jobs!inner(user_id)', { count: 'exact', head: true })
    .eq('sync_jobs.user_id', user!.id)

  const plan = userData?.plan || 'free'
  const maxSyncs = plan === 'pro' ? 'Unlimited' : 1
  const minInterval = plan === 'pro' ? '5 min' : '30 min'

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
        <p className="mt-1 text-sm text-gray-500">Your current plan and usage</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Current plan</h2>
            <Badge variant={plan === 'pro' ? 'success' : 'default'}>
              {plan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Sync jobs</p>
              <p className="text-2xl font-bold text-gray-900">{syncCount || 0}</p>
              <p className="text-xs text-gray-400">of {maxSyncs}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total sync runs</p>
              <p className="text-2xl font-bold text-gray-900">{logCount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Min sync interval</p>
              <p className="text-2xl font-bold text-gray-900">{minInterval}</p>
            </div>
          </div>

          {plan === 'free' && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Upgrade to Pro</p>
              <p className="text-sm text-gray-500 mb-3">
                Get unlimited syncs, 5-minute intervals, and priority support.
              </p>
              <Link
                href="/api/billing/checkout"
                className="inline-flex items-center bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Upgrade to Pro — $19/month
              </Link>
            </div>
          )}

          {plan === 'pro' && (
            <div className="mt-6">
              <Link
                href="/api/billing/portal"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Manage subscription →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
