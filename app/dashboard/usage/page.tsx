import { createClient } from '@/lib/supabase/server'
import { getLimits, currentMonth } from '@/lib/billing/plans'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight, Zap, CheckCircle } from 'lucide-react'

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === -1 ? 0 : Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-gray-900'
  return (
    <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 w-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function LimitLabel({ value, max }: { value: number; max: number }) {
  if (max === -1) return <span className="text-xs text-gray-400">{value.toLocaleString()} / unlimited</span>
  return (
    <span className="text-xs text-gray-400">
      {value.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

const PRO_FEATURES = [
  '10 sync connections',
  '5,000 rows / month',
  '5-minute sync interval',
  'Bidirectional & Sheets→Notion sync',
  'Priority support',
]

const BUSINESS_FEATURES = [
  'Unlimited sync connections',
  '100,000 rows / month',
  '1-minute sync interval',
  'Bidirectional sync',
  '5 team members',
  'Priority support',
]

export default async function UsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: userData },
    { count: connections },
    { data: usage },
  ] = await Promise.all([
    supabase.from('users').select('plan').eq('id', user!.id).single(),
    supabase.from('sync_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase
      .from('usage_monthly')
      .select('sync_runs, rows_processed')
      .eq('user_id', user!.id)
      .eq('month', currentMonth())
      .single(),
  ])

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)
  const connectionsUsed = connections ?? 0
  const rowsProcessed = usage?.rows_processed ?? 0
  const syncRuns = usage?.sync_runs ?? 0

  const planBadgeVariant = plan === 'business' ? 'success' : plan === 'pro' ? 'default' : 'warning'

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage & Plan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Current month: {currentMonth()}
        </p>
      </div>

      {/* Current plan */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Current plan</h2>
            <Badge variant={planBadgeVariant} className="capitalize text-sm px-3 py-1">
              {plan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Connections */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sync connections</span>
                <LimitLabel value={connectionsUsed} max={limits.max_connections} />
              </div>
              {limits.max_connections !== -1 && (
                <ProgressBar value={connectionsUsed} max={limits.max_connections} />
              )}
            </div>

            {/* Rows this month */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Rows synced this month</span>
                <LimitLabel value={rowsProcessed} max={limits.max_rows_per_month} />
              </div>
              {limits.max_rows_per_month !== -1 && (
                <ProgressBar value={rowsProcessed} max={limits.max_rows_per_month} />
              )}
            </div>

            {/* Sync runs */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sync runs this month</span>
                <span className="text-xs text-gray-400">{syncRuns.toLocaleString()}</span>
              </div>
            </div>

            {/* Plan features */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Min interval</p>
                <p className="text-sm font-medium text-gray-900">{limits.min_interval_minutes} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Bidirectional sync</p>
                <p className="text-sm font-medium text-gray-900">{limits.bidirectional_sync ? 'Included' : 'Not included'}</p>
              </div>
            </div>
          </div>

          {/* Manage / Portal link for paid plans */}
          {plan !== 'free' && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <a
                href="/api/billing/portal"
                className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
              >
                Manage subscription <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade CTAs */}
      {plan === 'free' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Pro */}
          <Card className="border-gray-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Pro</h3>
                <span className="text-sm font-bold text-gray-900">$19/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 mb-5">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/api/billing/checkout?plan=pro"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Zap className="w-4 h-4" /> Upgrade to Pro
              </a>
            </CardContent>
          </Card>

          {/* Business */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Business</h3>
                <span className="text-sm font-bold text-gray-900">$49/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 mb-5">
                {BUSINESS_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/api/billing/checkout?plan=business"
                className="w-full flex items-center justify-center gap-2 border border-gray-900 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upgrade to Business
              </a>
            </CardContent>
          </Card>
        </div>
      )}

      {plan === 'pro' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Business</h3>
              <span className="text-sm font-bold text-gray-900">$49/mo</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 mb-5">
              {BUSINESS_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/api/billing/checkout?plan=business"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upgrade to Business <ArrowRight className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
