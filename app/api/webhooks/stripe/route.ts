import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { PRICE_TO_PLAN } from '@/lib/billing/plans'

export const runtime = 'nodejs'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Resolve plan name from a Stripe Subscription (by price ID) */
function planFromSubscription(sub: Stripe.Subscription): string {
  const priceId = sub.items.data[0]?.price.id ?? ''
  return PRICE_TO_PLAN[priceId] ?? 'free'
}

/**
 * Upsert the subscriptions table and update users.plan.
 * overridePlan lets checkout.session.completed pass the plan from metadata
 * (price ID lookup is still more reliable, but metadata is a useful fallback).
 */
async function syncSubscription(
  supabase: ReturnType<typeof getServiceSupabase>,
  sub: Stripe.Subscription,
  overridePlan?: string
) {
  const customerId = sub.customer as string
  const plan = overridePlan ?? planFromSubscription(sub)

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userData?.id) {
    console.warn('[webhook] No user found for Stripe customer', customerId)
    return
  }

  const userId = userData.id
  const activePlan =
    sub.status === 'active' || sub.status === 'trialing' ? plan : 'free'

  // Cast to any: Stripe SDK typings vary by apiVersion;
  // current_period_start / _end are present at runtime in all versions.
  const subAny = sub as any

  // 1. Upsert subscriptions table (full Stripe state)
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: activePlan,
      status: sub.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      current_period_start: subAny.current_period_start
        ? new Date(subAny.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subAny.current_period_end
        ? new Date(subAny.current_period_end * 1000).toISOString()
        : null,
      trial_end: subAny.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  // 2. Update users.plan — single source of truth for feature gating
  await supabase
    .from('users')
    .update({
      plan: activePlan,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
    })
    .eq('id', userId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[webhook] Signature error:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const subscriptionId = session.subscription as string
        const plan = (session.metadata?.plan) as string | undefined
        const userId = session.metadata?.user_id

        if (!subscriptionId) break
        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        // Ensure customer is linked to the user (belt-and-suspenders)
        if (userId) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: sub.customer as string })
            .eq('id', userId)
        }

        await syncSubscription(supabase, sub, plan)
        break
      }

      // ── Subscription changed (upgrade / downgrade / renewal / pause) ───────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscription(supabase, sub)
        break
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userData?.id) break

        await supabase.from('subscriptions').upsert(
          {
            user_id: userData.id,
            plan: 'free',
            status: 'canceled',
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        await supabase
          .from('users')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('id', userData.id)
        break
      }

      // ── Payment failed (mark as past_due, don't revoke immediately) ────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string | null
        if (!subscriptionId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }
    }
  } catch (err: any) {
    console.error('[webhook] Handler error:', err.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
