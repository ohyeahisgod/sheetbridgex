'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Plus, BarChart2, LogOut, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface PlanSummary {
  plan: string
  label: string
  connectionsUsed: number
  maxConnections: number
  rowsProcessed: number
  maxRows: number
}

const navItems = [
  { href: '/dashboard', label: 'My Syncs', icon: LayoutDashboard },
  { href: '/dashboard/create', label: 'Create Sync', icon: Plus },
  { href: '/dashboard/usage', label: 'Usage', icon: BarChart2 },
]

const PLAN_DOT: Record<string, string> = {
  free:     'bg-gray-400',
  starter:  'bg-blue-500',
  pro:      'bg-violet-500',
  business: 'bg-emerald-500',
}

export function Sidebar({ planSummary }: { planSummary?: PlanSummary }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const plan = planSummary?.plan ?? 'free'
  const isPaid = plan !== 'free'
  const dot = PLAN_DOT[plan] ?? PLAN_DOT.free
  const connText = planSummary
    ? planSummary.maxConnections === -1
      ? `${planSummary.connectionsUsed} syncs`
      : `${planSummary.connectionsUsed} / ${planSummary.maxConnections} syncs`
    : null
  const rowText = planSummary
    ? planSummary.maxRows === -1
      ? `${planSummary.rowsProcessed.toLocaleString()} rows`
      : `${planSummary.rowsProcessed.toLocaleString()} / ${planSummary.maxRows.toLocaleString()} rows`
    : null

  return (
    <aside className="w-56 min-h-screen border-r border-gray-100 bg-white flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">SB</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">SheetBridgeX</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Plan mini-card */}
      {planSummary && (
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            {/* Plan name */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              <span className="text-xs font-semibold text-gray-900">{planSummary.label} Plan</span>
            </div>

            {/* Stats */}
            <div className="space-y-1 mb-3">
              {connText && (
                <p className="text-xs text-gray-500">{connText} used</p>
              )}
              {rowText && (
                <p className="text-xs text-gray-500">{rowText} this month</p>
              )}
            </div>

            {/* CTA */}
            {!isPaid ? (
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-1.5 w-full bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Upgrade
              </Link>
            ) : (
              <a
                href="/api/billing/portal"
                className="flex items-center justify-center w-full border border-gray-200 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage plan
              </a>
            )}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
