import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";

import db from "@/db/drizzle";
import { userSubscription } from "@/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    console.error("Stripe webhook signature verification failed:", error);
    return new NextResponse("Webhook error: invalid signature.", {
      status: 400,
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // user subscription completed
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId)
      return new NextResponse("User id is required.", { status: 400 });

    await db.insert(userSubscription).values({
      userId: session.metadata.userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000
      ), // in ms
    });
  }

  // renew user subscription
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db
      .update(userSubscription)
      .set({
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.items.data[0].current_period_end * 1000 // in ms
        ),
      })
      .where(eq(userSubscription.stripeSubscriptionId, subscription.id));
  }

  // subscription cancelled: deactivate by clearing the current period end so
  // downstream `isPro` checks (which compare against `Date.now()`) treat it
  // as expired.
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await db
      .update(userSubscription)
      .set({
        stripeCurrentPeriodEnd: new Date(0),
      })
      .where(eq(userSubscription.stripeSubscriptionId, subscription.id));
  }

  // subscription updated (e.g. plan change, renewal, cancel-at-period-end
  // toggled): refresh the stored price and period end from Stripe.
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    await db
      .update(userSubscription)
      .set({
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: subscription.cancel_at_period_end
          ? new Date(0)
          : new Date(subscription.items.data[0].current_period_end * 1000),
      })
      .where(eq(userSubscription.stripeSubscriptionId, subscription.id));
  }

  return new NextResponse(null, { status: 200 });
}
