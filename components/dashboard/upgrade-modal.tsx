'use client'

import { useState } from 'react'
import { X, Zap, CheckCircle, Lock, ArrowRight } from 'lucide-react'
import { SupportModal } from '@/components/support/support-modal'

type UpgradeReason = 'connection_limit' | 'bidirectional' | 'row_limit' | 'interval'

const REASONS: Record<UpgradeReason, { title: string; description: string }> = {
  connection_limit: {
    title: 'Connection limit reached',
    description: 'Your current plan supports 1 sync connection. Upgrade to Pro to add up to 10 syncs.',
  },
  bidirectional: {
    title: '2-way sync is a Pro feature',
    description: 'Bidirectional and Sheets → Notion sync require a Pro or Business plan.',
  },
  row_limit: {
    title: 'Monthly row limit reached',
    description: "You've used all your rows for this month. Upgrade to continue syncing data.",
  },
  interval: {
    title: 'Faster sync requires Pro',
    description: 'Sync intervals under 30 minutes are available on Pro and Business plans.',
  },
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9',
    features: ['3 sync connections', '1,000 rows / month', '15-minute intervals', 'Notion → Sheets'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    features: ['10 sync connections', '5,000 rows / month', '5-minute intervals', '2-way sync enabled', 'Priority support'],
    highlight: true,
  },
]

interface UpgradeModalProps {
  reason: UpgradeReason
  onClose: () => void
}

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const info = REASONS[reason]

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoadingPlan(null)
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-4.5 h-4.5 text-gray-700" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">{info.title}</h2>
          <p className="text-sm text-gray-500">{info.description}</p>
        </div>

        {/* Plan options */}
        <div className="p-5 space-y-3">
          {PLANS.map(p => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 ${p.highlight ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`text-sm font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {p.name}
                  </span>
                  {p.highlight && (
                    <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                      Most popular
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {p.price}<span className={`text-xs font-normal ${p.highlight ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                </span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${p.highlight ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={p.highlight ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(p.id)}
                disabled={loadingPlan !== null}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
                  p.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {loadingPlan === p.id ? (
                  'Redirecting…'
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade to {p.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between">
          <button
            onClick={() => setSupportOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Contact support
          </button>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Compare all plans <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {supportOpen && (
        <SupportModal
          onClose={() => setSupportOpen(false)}
          defaultIssueType="billing"
        />
      )}
    </div>
  )
}
