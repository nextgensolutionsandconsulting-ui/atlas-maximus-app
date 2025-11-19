
import { prisma } from '@/lib/db'
import {
  TaskStatus,
  TaskPriority,
  NotificationType,
  FeedActionType,
  FeedVisibility,
  DocumentPermission,
} from '@prisma/client'

export class CollaborationManager {
  /**
   * Create a new workspace
   */
  static async createWorkspace(
    ownerId: string,
    name: string,
    description?: string,
    teamId?: string,
    isPublic: boolean = false
  ) {
    return await prisma.workspace.create({
      data: {
        ownerId,
        name,
        description,
        teamId,
        isPublic,
        allowedUsers: [ownerId], // Owner is automatically added
      },
    })
  }

  /**
   * Add user to workspace
   */
  static async addUserToWorkspace(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      throw new Error('Workspace not found')
    }

    if (!workspace.allowedUsers.includes(userId)) {
      return await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          allowedUsers: [...workspace.allowedUsers, userId],
        },
      })
    }

    return workspace
  }

  /**
   * Send message to workspace
   */
  static async sendMessage(
    workspaceId: string,
    userId: string,
    content: string,
    mentions: string[] = [],
    attachments?: any,
    threadParentId?: string
  ) {
    const message = await prisma.workspaceMessage.create({
      data: {
        workspaceId,
        userId,
        content,
        mentions,
        attachments,
        threadParentId,
      },
    })

    // Create notifications for mentions
    if (mentions.length > 0) {
      await Promise.all(
        mentions.map(mentionedUserId =>
          this.createNotification(
            mentionedUserId,
            'MENTION',
            'You were mentioned',
            `You were mentioned in ${workspaceId}`,
            `/workspace/${workspaceId}`
          )
        )
      )
    }

    // Create activity feed entry
    await this.createActivityFeed(
      userId,
      'CREATED',
      'Message',
      message.id,
      `Posted a message`,
      { workspaceId }
    )

    return message
  }

  /**
   * Create a collaborative task
   */
  static async createTask(
    workspaceId: string,
    createdBy: string,
    title: string,
    description?: string,
    assignedTo: string[] = [],
    status: TaskStatus = 'TODO',
    priority: TaskPriority = 'MEDIUM',
    dueDate?: Date,
    tags: string[] = []
  ) {
    const task = await prisma.collaborativeTask.create({
      data: {
        workspaceId,
        createdBy,
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
        tags,
      },
    })

    // Notify assigned users
    if (assignedTo.length > 0) {
      await Promise.all(
        assignedTo.map(userId =>
          this.createNotification(
            userId,
            'TASK_ASSIGNED',
            'New task assigned',
            `You have been assigned to: ${title}`,
            `/workspace/${workspaceId}/tasks/${task.id}`
          )
        )
      )
    }

    // Create activity feed entry
    await this.createActivityFeed(
      createdBy,
      'CREATED',
      'Task',
      task.id,
      `Created task: ${title}`,
      { workspaceId, priority, status }
    )

    return task
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    userId: string,
    status: TaskStatus
  ) {
    const task = await prisma.collaborativeTask.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === 'DONE' && { completedAt: new Date() }),
      },
    })

    // Notify task owner if different from updater
    if (task.createdBy !== userId) {
      await this.createNotification(
        task.createdBy,
        'TASK_COMPLETED',
        'Task status updated',
        `Task "${task.title}" status changed to ${status}`,
        `/workspace/${task.workspaceId}/tasks/${task.id}`
      )
    }

    // Create activity feed entry
    await this.createActivityFeed(
      userId,
      'UPDATED',
      'Task',
      task.id,
      `Updated task status to ${status}`,
      { workspaceId: task.workspaceId, status }
    )

    return task
  }

  /**
   * Share document with workspace
   */
  static async shareDocument(
    workspaceId: string,
    documentId: string,
    sharedBy: string,
    permissions: DocumentPermission = 'VIEW'
  ) {
    const sharedDoc = await prisma.workspaceDocument.create({
      data: {
        workspaceId,
        documentId,
        sharedBy,
        permissions,
      },
    })

    // Get workspace members to notify
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (workspace) {
      const otherUsers = workspace.allowedUsers.filter(u => u !== sharedBy)
      
      await Promise.all(
        otherUsers.map(userId =>
          this.createNotification(
            userId,
            'DOCUMENT_SHARED',
            'Document shared',
            'A new document was shared with your workspace',
            `/workspace/${workspaceId}/documents`
          )
        )
      )
    }

    // Create activity feed entry
    await this.createActivityFeed(
      sharedBy,
      'SHARED',
      'Document',
      documentId,
      `Shared a document`,
      { workspaceId }
    )

    return sharedDoc
  }

  /**
   * Create notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any
  ) {
    return await prisma.notification.create({
      data: {
        userId,
        notificationType: type,
        title,
        message,
        actionUrl,
        metadata,
      },
    })
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /**
   * Create activity feed entry
   */
  static async createActivityFeed(
    userId: string,
    actionType: FeedActionType,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: any,
    visibility: FeedVisibility = 'WORKSPACE'
  ) {
    const workspaceId = metadata?.workspaceId
    const teamId = metadata?.teamId

    return await prisma.activityFeed.create({
      data: {
        userId,
        actionType,
        entityType,
        entityId,
        description,
        metadata,
        visibility,
        workspaceId,
        teamId,
      },
    })
  }

  /**
   * Get workspace activity feed
   */
  static async getWorkspaceActivityFeed(workspaceId: string, limit: number = 50) {
    return await prisma.activityFeed.findMany({
      where: {
        OR: [
          { workspaceId },
          { visibility: 'PUBLIC' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get team activity feed
   */
  static async getTeamActivityFeed(teamId: string, limit: number = 50) {
    return await prisma.activityFeed.findMany({
      where: {
        OR: [
          { teamId },
          { visibility: 'PUBLIC' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get workspace messages
   */
  static async getWorkspaceMessages(workspaceId: string, limit: number = 100) {
    return await prisma.workspaceMessage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get workspace tasks
   */
  static async getWorkspaceTasks(
    workspaceId: string,
    status?: TaskStatus,
    assignedTo?: string
  ) {
    return await prisma.collaborativeTask.findMany({
      where: {
        workspaceId,
        ...(status && { status }),
        ...(assignedTo && { assignedTo: { has: assignedTo } }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get user workspaces
   */
  static async getUserWorkspaces(userId: string) {
    return await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { allowedUsers: { has: userId } },
          { isPublic: true },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    })
  }
}
