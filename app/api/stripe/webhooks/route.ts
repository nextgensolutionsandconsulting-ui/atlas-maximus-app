
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    console.log('Webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' }, 
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    const userId = session.metadata?.userId
    if (!userId) return

    const subscription = await stripe.subscriptions.retrieve(session.subscription)

    await prisma.subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items?.data?.[0]?.price?.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
      }
    })

    // Update user subscription status
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'ACTIVE' }
    })

  } catch (error) {
    console.error('Handle checkout completed error:', error)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const userId = subscription.metadata?.userId
    
    if (!userId) return

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'ACTIVE' }
    })

  } catch (error) {
    console.error('Handle payment succeeded error:', error)
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const userId = subscription.metadata?.userId
    
    if (!userId) return

    await prisma.subscription.update({
      where: { userId },
      data: { status: 'PAST_DUE' }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'PAST_DUE' }
    })

  } catch (error) {
    console.error('Handle payment failed error:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const userId = subscription.metadata?.userId
    if (!userId) return

    const status = subscription.status.toUpperCase()
    
    await prisma.subscription.update({
      where: { userId },
      data: {
        status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: status }
    })

  } catch (error) {
    console.error('Handle subscription updated error:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const userId = subscription.metadata?.userId
    if (!userId) return

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date()
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'CANCELED' }
    })

  } catch (error) {
    console.error('Handle subscription deleted error:', error)
  }
}
