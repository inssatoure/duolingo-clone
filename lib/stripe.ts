import Stripe from "stripe";

// Lazily construct the Stripe client on first real use instead of at module
// load, so builds don't crash for environments missing
// STRIPE_API_SECRET_KEY (e.g. a Preview deployment with only Production env
// vars) - see db/drizzle.ts for the same pattern and full rationale.
let cached: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!cached) {
    if (!process.env.STRIPE_API_SECRET_KEY)
      throw new Error(
        "STRIPE_API_SECRET_KEY is not set for this environment. Configure it in Vercel (Project Settings -> Environment Variables) for Production and/or Preview."
      );
    cached = new Stripe(process.env.STRIPE_API_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return cached;
};

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
