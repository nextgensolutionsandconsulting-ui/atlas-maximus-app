
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnalyticsEngine } from '@/lib/analytics-engine'
import { ActivityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      activityType,
      entityType,
      entityId,
      metadata,
      duration,
    } = body as {
      activityType: ActivityType
      entityType: string
      entityId?: string
      metadata?: any
      duration?: number
    }

    if (!activityType || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const activity = await AnalyticsEngine.trackActivity(
      session.user.id,
      activityType,
      entityType,
      entityId,
      metadata,
      duration
    )

    return NextResponse.json(activity)
  } catch (error: any) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track activity' },
      { status: 500 }
    )
  }
}
