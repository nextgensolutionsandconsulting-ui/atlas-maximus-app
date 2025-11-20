export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

import Stripe from "stripe";

// Build-safe Stripe init: don't throw if key is missing
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    // If Stripe isn't configured, fail gracefully instead of breaking the build
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured on this server." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Get or create Stripe customer
    let customer;

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
    });

    if (existingSubscription?.stripeCustomerId) {
      // Get existing customer
      customer = await stripe.customers.retrieve(
        existingSubscription.stripeCustomerId
      );
    } else {
      // Create new customer
      const customerData: Stripe.CustomerCreateParams = {
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
          agileRole: (session.user as any).agileRole || "SCRUM_MASTER",
        },
      };

      customer = await stripe.customers.create(customerData);

      // Create or update subscription record
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customer.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: customer.id,
          status: "INACTIVE",
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Atlas Maximus Pro",
              description:
                "Full access to your Agile Learning companion with talking avatar",
              images: [`${origin}/og-image.png`],
            },
            unit_amount: 1000, // $10.00 in cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
