
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CollaborationManager } from '@/lib/collaboration'
import { TaskStatus, TaskPriority } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = params.id
    const body = await request.json()
    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      dueDate,
      tags,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    const task = await CollaborationManager.createTask(
      workspaceId,
      session.user.id,
      title,
      description,
      assignedTo || [],
      status as TaskStatus || 'TODO',
      priority as TaskPriority || 'MEDIUM',
      dueDate ? new Date(dueDate) : undefined,
      tags || []
    )

    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}

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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TaskStatus | undefined
    const assignedTo = searchParams.get('assignedTo') || undefined

    const tasks = await CollaborationManager.getWorkspaceTasks(
      workspaceId,
      status,
      assignedTo
    )

    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
