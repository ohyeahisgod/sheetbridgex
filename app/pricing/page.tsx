import Link from 'next/link'
import { PricingCards } from './pricing-cards'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Pricing — SheetBridgeX',
  description: 'Simple, transparent pricing. Start free, upgrade when you need more.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">SheetBridgeX</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
              <Link
                href="/login"
                className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Start free. Upgrade when your data outgrows the free tier.
          No hidden fees, cancel any time.
        </p>
      </div>

      {/* Cards — client component handles checkout */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <PricingCards />
      </div>

      {/* FAQ */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans?',
                a: 'Yes, upgrade or downgrade at any time. Prorated credits apply immediately.',
              },
              {
                q: 'What counts as a "row"?',
                a: 'Each Notion record processed during a sync run counts as one row, regardless of direction.',
              },
              {
                q: 'What happens when I hit my row limit?',
                a: 'Scheduled syncs stop running. You can still use the dashboard and trigger manual syncs on the next billing cycle.',
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free plan is free forever. Paid plans can be cancelled any time — no annual commitment required.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-medium text-gray-900 mb-1">{q}</p>
                <p className="text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
