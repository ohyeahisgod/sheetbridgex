'use client'

import { useState } from 'react'
import { CheckCircle, Zap, ArrowLeftRight } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  highlight?: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Try it out — no credit card required.',
    features: [
      '1 sync connection',
      '100 rows / month',
      '30-minute sync interval',
      'Notion → Sheets (one-way)',
      'Manual sync',
    ],
    cta: 'Start free',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    description: 'For individuals who sync regularly.',
    features: [
      '3 sync connections',
      '1,000 rows / month',
      '15-minute sync interval',
      'Notion → Sheets (one-way)',
      'Email support',
    ],
    cta: 'Upgrade to Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'For power users who need real-time 2-way sync.',
    features: [
      '10 sync connections',
      '5,000 rows / month',
      '5-minute sync interval',
      'Bidirectional & Sheets → Notion',
      'Priority support',
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
  },
  {
    id: 'business',
    name: 'Business',
    price: 49,
    description: 'For teams with high-volume sync needs.',
    features: [
      'Unlimited connections',
      '100,000 rows / month',
      '1-minute sync interval',
      'Bidirectional sync',
      '5 team members',
      'Priority support',
    ],
    cta: 'Upgrade to Business',
  },
]

export function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkout(planId: string) {
    if (planId === 'free') {
      window.location.href = '/login'
      return
    }

    setLoading(planId)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await res.json()

      if (res.status === 401) {
        // Not logged in — redirect to login, then back to pricing
        window.location.href = `/login?redirect=/pricing`
        return
      }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-6 flex flex-col ${
              plan.highlight
                ? 'bg-gray-900 text-white ring-2 ring-gray-900'
                : 'bg-white border border-gray-200'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>
            )}

            <div className="mb-5">
              <h3 className={`text-base font-semibold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                )}
              </div>
              <p className={`text-xs ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                {plan.description}
              </p>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-green-500'}`}
                  />
                  <span className={plan.highlight ? 'text-gray-300' : 'text-gray-700'}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => checkout(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                plan.highlight
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : plan.id === 'free'
                  ? 'border border-gray-200 text-gray-700 hover:border-gray-400'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {loading === plan.id ? 'Redirecting…' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
