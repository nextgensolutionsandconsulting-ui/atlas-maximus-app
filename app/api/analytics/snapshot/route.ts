
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnalyticsEngine } from '@/lib/analytics-engine'
import { AnalyticsType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      startDate,
      endDate,
      teamId,
    } = body as {
      type: AnalyticsType
      startDate: string
      endDate: string
      teamId?: string
    }

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const snapshot = await AnalyticsEngine.generateSnapshot(
      type,
      new Date(startDate),
      new Date(endDate),
      session.user.id,
      teamId
    )

    return NextResponse.json(snapshot)
  } catch (error: any) {
    console.error('Error generating analytics snapshot:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate analytics snapshot' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as AnalyticsType
    const teamId = searchParams.get('teamId') || undefined

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter required' },
        { status: 400 }
      )
    }

    // Get last 30 days by default
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const snapshot = await AnalyticsEngine.generateSnapshot(
      type,
      startDate,
      endDate,
      session.user.id,
      teamId
    )

    return NextResponse.json(snapshot)
  } catch (error: any) {
    console.error('Error fetching analytics snapshot:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics snapshot' },
      { status: 500 }
    )
  }
}
