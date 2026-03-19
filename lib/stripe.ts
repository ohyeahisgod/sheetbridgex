import Stripe from 'stripe'

function createStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  })
}

let _instance: Stripe | null = null

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_instance) {
      _instance = createStripe()
    }
    const value = (_instance as any)[prop]
    return typeof value === 'function' ? value.bind(_instance) : value
  },
})
