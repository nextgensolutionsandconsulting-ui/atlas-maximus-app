import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

// Build-safe Stripe init
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: NextRequest) {
  // If Stripe or the webhook secret isn't configured, fail gracefully
  if (!stripe || !webhookSecret) {
    console.warn(
      "Stripe webhook called but STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set"
    );
    return new NextResponse("Stripe not configured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    // Get raw body text for webhook verification
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return new NextResponse(`Webhook Error: ${err?.message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : null;

        if (userId) {
          await prisma.subscription.updateMany({
            where: { userId },
            data: {
              status: "ACTIVE",
              stripeSubscriptionId,
            },
          });
        }

        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Error handling Stripe webhook:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
