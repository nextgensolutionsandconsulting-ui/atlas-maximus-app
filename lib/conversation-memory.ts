
import { prisma } from './db'
import { InsightType, SummaryType, MessageRole } from '@prisma/client'

export interface ConversationMemoryQuery {
  query: string
  userId: string
  sessionLimit?: number
}

export interface SessionMemory {
  id: string
  sessionNumber: number
  title: string | null
  summary: string | null
  topics: string[]
  decisions: any
  actionItems: any
  startedAt: Date
  endedAt: Date | null
  messageCount: number
}

/**
 * Creates or gets the current active session for a user
 */
export async function getOrCreateActiveSession(
  userId: string,
  agileRole?: string
): Promise<string> {
  // Check for existing active session
  const activeSession = await prisma.conversationSession.findFirst({
    where: {
      userId,
      isActive: true
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  if (activeSession) {
    return activeSession.id
  }

  // Create new session
  const sessionCount = await prisma.conversationSession.count({
    where: { userId }
  })

  const newSession = await prisma.conversationSession.create({
    data: {
      userId,
      sessionNumber: sessionCount + 1,
      agileRole: agileRole as any,
      title: `Session ${sessionCount + 1}`,
      isActive: true
    }
  })

  return newSession.id
}

/**
 * Adds a message to the current session
 */
export async function addMessageToSession(
  sessionId: string,
  content: string,
  role: MessageRole,
  metadata?: any
): Promise<void> {
  await prisma.sessionMessage.create({
    data: {
      sessionId,
      content,
      role,
      metadata: metadata || {}
    }
  })

  // Update message count
  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: {
      messageCount: {
        increment: 1
      }
    }
  })
}

/**
 * Ends a session and generates a summary
 */
export async function endSession(sessionId: string): Promise<void> {
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      },
      insights: true
    }
  })

  if (!session) return

  // Generate summary using LLM
  const summary = await generateSessionSummary(session.messages)
  const topics = extractTopics(session.messages)
  const { decisions, actionItems } = extractDecisionsAndActions(session.insights)

  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endedAt: new Date(),
      summary,
      topics,
      decisions,
      actionItems
    }
  })
}

/**
 * Extracts insights from messages
 */
export async function extractInsights(
  sessionId: string,
  messages: any[]
): Promise<void> {
  const insights: any[] = []

  for (const message of messages) {
    // Simple keyword-based extraction (can be enhanced with LLM)
    const content = message.content.toLowerCase()

    // Extract decisions
    if (content.includes('decided') || content.includes('decision') || content.includes('we will')) {
      insights.push({
        sessionId,
        insightType: 'DECISION',
        title: 'Decision Made',
        content: message.content,
        relevance: 0.8
      })
    }

    // Extract action items
    if (content.includes('action item') || content.includes('todo') || content.includes('should')) {
      insights.push({
        sessionId,
        insightType: 'ACTION_ITEM',
        title: 'Action Item Identified',
        content: message.content,
        relevance: 0.7
      })
    }

    // Extract best practices
    if (content.includes('best practice') || content.includes('recommend')) {
      insights.push({
        sessionId,
        insightType: 'BEST_PRACTICE',
        title: 'Best Practice',
        content: message.content,
        relevance: 0.9
      })
    }

    // Extract impediments
    if (content.includes('blocked') || content.includes('impediment') || content.includes('issue')) {
      insights.push({
        sessionId,
        insightType: 'IMPEDIMENT',
        title: 'Impediment Identified',
        content: message.content,
        relevance: 0.85
      })
    }
  }

  // Save insights
  if (insights.length > 0) {
    await prisma.conversationInsight.createMany({
      data: insights
    })
  }
}

/**
 * Retrieves conversation memory for a user
 */
export async function getConversationMemory(
  userId: string,
  sessionLimit: number = 5
): Promise<SessionMemory[]> {
  const sessions = await prisma.conversationSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: sessionLimit,
    select: {
      id: true,
      sessionNumber: true,
      title: true,
      summary: true,
      topics: true,
      decisions: true,
      actionItems: true,
      startedAt: true,
      endedAt: true,
      messageCount: true
    }
  })

  return sessions
}

/**
 * Searches conversation history
 */
export async function searchConversationHistory(
  query: ConversationMemoryQuery
): Promise<any[]> {
  const { query: searchQuery, userId, sessionLimit = 10 } = query

  // Get recent sessions
  const sessions = await prisma.conversationSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: sessionLimit,
    include: {
      messages: {
        where: {
          content: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  return sessions.filter(s => s.messages.length > 0)
}

/**
 * Generates a summary for recent sessions
 */
export async function generateRecentSessionsSummary(
  userId: string,
  sessionCount: number = 3
): Promise<string> {
  const sessions = await getConversationMemory(userId, sessionCount)

  if (sessions.length === 0) {
    return "No recent conversation history found."
  }

  let summaryText = `Summary of your last ${sessions.length} conversation(s):\n\n`

  sessions.forEach((session, idx) => {
    summaryText += `### Session ${session.sessionNumber} (${formatDate(session.startedAt)})\n`
    if (session.summary) {
      summaryText += `${session.summary}\n\n`
    }
    if (session.topics && session.topics.length > 0) {
      summaryText += `**Topics discussed:** ${session.topics.join(', ')}\n\n`
    }
    if (session.decisions) {
      const decisionList = Array.isArray(session.decisions) ? session.decisions : []
      if (decisionList.length > 0) {
        summaryText += `**Key decisions:** ${decisionList.join(', ')}\n\n`
      }
    }
    if (session.actionItems) {
      const actionList = Array.isArray(session.actionItems) ? session.actionItems : []
      if (actionList.length > 0) {
        summaryText += `**Action items:** ${actionList.join(', ')}\n\n`
      }
    }
    summaryText += '---\n\n'
  })

  return summaryText
}

/**
 * Generates a topic-based summary
 */
export async function generateTopicSummary(
  userId: string,
  topic: string
): Promise<string> {
  const sessions = await prisma.conversationSession.findMany({
    where: {
      userId,
      topics: {
        has: topic
      }
    },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      insights: {
        where: {
          content: {
            contains: topic,
            mode: 'insensitive'
          }
        }
      }
    }
  })

  if (sessions.length === 0) {
    return `No conversations found about "${topic}".`
  }

  let summaryText = `# Insights about "${topic}"\n\n`
  summaryText += `Found ${sessions.length} conversation(s) discussing this topic.\n\n`

  sessions.forEach(session => {
    if (session.summary) {
      summaryText += `- **Session ${session.sessionNumber}:** ${session.summary}\n`
    }
    if (session.insights.length > 0) {
      session.insights.forEach(insight => {
        summaryText += `  - ${insight.title}: ${insight.content.substring(0, 150)}...\n`
      })
    }
  })

  return summaryText
}

// Helper functions
function generateSessionSummary(messages: any[]): string {
  // Simple extraction - can be enhanced with LLM
  const userMessages = messages.filter(m => m.role === 'USER')
  const assistantMessages = messages.filter(m => m.role === 'ASSISTANT')

  if (messages.length === 0) {
    return "Empty session"
  }

  const firstUserMsg = userMessages[0]?.content || "No user messages"
  const summary = `Discussed: ${firstUserMsg.substring(0, 100)}... (${messages.length} messages exchanged)`
  
  return summary
}

function extractTopics(messages: any[]): string[] {
  const topics = new Set<string>()
  
  // Common Agile topics
  const agileKeywords = [
    'sprint', 'retrospective', 'planning', 'scrum', 'kanban',
    'user story', 'epic', 'backlog', 'velocity', 'stand-up',
    'definition of done', 'acceptance criteria', 'impediment',
    'story points', 'pi planning', 'safe', 'agile coach'
  ]

  messages.forEach(msg => {
    const content = msg.content.toLowerCase()
    agileKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.add(keyword)
      }
    })
  })

  return Array.from(topics).slice(0, 10) // Limit to 10 topics
}

function extractDecisionsAndActions(insights: any[]): {
  decisions: string[]
  actionItems: string[]
} {
  const decisions = insights
    .filter(i => i.insightType === 'DECISION')
    .map(i => i.content.substring(0, 200))

  const actionItems = insights
    .filter(i => i.insightType === 'ACTION_ITEM')
    .map(i => i.content.substring(0, 200))

  return { decisions, actionItems }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
