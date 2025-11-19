
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CollaborationManager } from '@/lib/collaboration'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = params.id
    const activityFeed = await CollaborationManager.getWorkspaceActivityFeed(workspaceId)

    return NextResponse.json(activityFeed)
  } catch (error: any) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}
