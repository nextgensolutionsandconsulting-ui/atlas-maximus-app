
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CollaborationManager } from '@/lib/collaboration'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, teamId, isPublic } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      )
    }

    const workspace = await CollaborationManager.createWorkspace(
      session.user.id,
      name,
      description,
      teamId,
      isPublic || false
    )

    return NextResponse.json(workspace)
  } catch (error: any) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create workspace' },
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

    const workspaces = await CollaborationManager.getUserWorkspaces(session.user.id)

    return NextResponse.json(workspaces)
  } catch (error: any) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}
