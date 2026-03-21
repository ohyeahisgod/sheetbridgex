import Link from 'next/link'
import { Lock, CheckCircle, Clock, Zap, ArrowRight, AlertTriangle } from 'lucide-react'
import { PlanLimits } from '@/lib/billing/plans'

interface PlanBannerProps {
  plan: string
  limits: PlanLimits
  connectionsUsed: number
  rowsProcessed: number
}

function MiniBar({ value, max }: { value: number; max: number }) {
  if (max === -1) return <span className="text-xs text-gray-400 mt-0.5 block">Unlimited</span>
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-gray-900'
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const PLAN_BADGE: Record<string, string> = {
  free:     'text-gray-600  bg-gray-100',
  starter:  'text-blue-700  bg-blue-50  border border-blue-100',
  pro:      'text-violet-700 bg-violet-50 border border-violet-100',
  business: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
}

export function PlanBanner({ plan, limits, connectionsUsed, rowsProcessed }: PlanBannerProps) {
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free
  const rowPct = limits.max_rows_per_month === -1 ? 0 : (rowsProcessed / limits.max_rows_per_month) * 100
  const connPct = limits.max_connections === -1 ? 0 : (connectionsUsed / limits.max_connections) * 100
  const nearRowLimit = rowPct >= 80
  const atConnLimit = limits.max_connections !== -1 && connectionsUsed >= limits.max_connections

  const borderClass = rowPct >= 90 || atConnLimit
    ? 'border-red-200'
    : nearRowLimit
    ? 'border-yellow-200'
    : 'border-gray-200'

  return (
    <div className={`mb-6 rounded-xl border ${borderClass} bg-white`}>
      {/* Warning bar */}
      {(nearRowLimit || atConnLimit) && (
        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-medium border-b ${rowPct >= 90 || atConnLimit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {atConnLimit
            ? 'Connection limit reached — upgrade to add more syncs.'
            : rowPct >= 90
            ? `Row limit almost full (${rowsProcessed.toLocaleString()} / ${limits.max_rows_per_month.toLocaleString()}) — upgrade before syncs stop.`
            : `Approaching monthly row limit (${Math.round(rowPct)}% used).`
          }
          <Link href="/pricing" className="ml-auto underline font-semibold">Upgrade →</Link>
        </div>
      )}

      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-5">

        {/* ── Left: plan badge + usage stats ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
              {limits.label}
            </span>
            <span className="text-xs text-gray-400">Current plan</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {/* Connections */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Sync connections</span>
                <span className={`text-xs font-semibold tabular-nums ${atConnLimit ? 'text-red-600' : 'text-gray-900'}`}>
                  {connectionsUsed} of {limits.max_connections === -1 ? '∞' : limits.max_connections}
                </span>
              </div>
              <MiniBar value={connectionsUsed} max={limits.max_connections} />
            </div>

            {/* Rows */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Rows this month</span>
                <span className={`text-xs font-semibold tabular-nums ${rowPct >= 90 ? 'text-red-600' : rowPct >= 75 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {rowsProcessed.toLocaleString()} of {limits.max_rows_per_month === -1 ? '∞' : limits.max_rows_per_month.toLocaleString()}
                </span>
              </div>
              <MiniBar value={rowsProcessed} max={limits.max_rows_per_month} />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="hidden sm:block w-px h-12 bg-gray-100 flex-shrink-0" />

        {/* ── Centre: feature flags ── */}
        <div className="flex sm:flex-col gap-4 sm:gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Every <strong className="text-gray-900">{limits.min_interval_minutes}m</strong> min</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {limits.bidirectional_sync ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">2-way sync <strong className="text-green-700">enabled</strong></span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500">2-way sync <strong>locked</strong></span>
              </>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="hidden sm:block w-px h-12 bg-gray-100 flex-shrink-0" />

        {/* ── Right: CTAs ── */}
        <div className="flex sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0">
          {plan === 'free' || plan === 'starter' ? (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade plan
            </Link>
          ) : (
            <a
              href="/api/billing/portal"
              className="inline-flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage plan
            </a>
          )}
          <Link
            href="/dashboard/usage"
            className="inline-flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors py-1"
          >
            View usage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  )
}
