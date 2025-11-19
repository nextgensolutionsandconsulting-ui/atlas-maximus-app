
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * POST - Query Jira issues with natural language
 * This endpoint translates user queries into database queries
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, datasetId } = await req.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Get user's active datasets
    const datasets = await prisma.jiraDataset.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(datasetId && { id: datasetId }),
      },
    })

    if (datasets.length === 0) {
      return NextResponse.json(
        { error: "No active Jira datasets found. Please upload Jira data first." },
        { status: 404 }
      )
    }

    const datasetIds = datasets.map(d => d.id)

    // Parse query intent and build filters
    const filters = buildFiltersFromQuery(query)

    // Query issues
    const issues = await prisma.jiraIssue.findMany({
      where: {
        datasetId: { in: datasetIds },
        ...filters,
      },
      include: {
        dataset: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { createdDate: 'desc' },
      ],
      take: 100, // Limit results
    })

    // Aggregate insights
    const insights = generateInsights(issues, query)

    return NextResponse.json({
      success: true,
      query,
      matchedIssues: issues.length,
      issues: issues.slice(0, 50), // Return first 50 for display
      insights,
    })
  } catch (error: any) {
    console.error("Jira query error:", error)
    return NextResponse.json(
      { error: "Failed to query Jira data" },
      { status: 500 }
    )
  }
}

/**
 * Build Prisma filters from natural language query
 */
function buildFiltersFromQuery(query: string): any {
  const filters: any = {}
  const lowerQuery = query.toLowerCase()

  // Status filters
  if (lowerQuery.includes('in progress') || lowerQuery.includes('in-progress')) {
    filters.status = { contains: 'In Progress', mode: 'insensitive' }
  } else if (lowerQuery.includes('done') || lowerQuery.includes('completed')) {
    filters.status = { contains: 'Done', mode: 'insensitive' }
  } else if (lowerQuery.includes('to do') || lowerQuery.includes('todo') || lowerQuery.includes('backlog')) {
    filters.status = { in: ['To Do', 'Backlog'], mode: 'insensitive' }
  } else if (lowerQuery.includes('blocked')) {
    filters.status = { contains: 'Blocked', mode: 'insensitive' }
  }

  // Story points
  if (lowerQuery.includes('missing story points') || lowerQuery.includes('no story points') || lowerQuery.includes('without points')) {
    filters.OR = [
      { storyPoints: null },
      { storyPoints: 0 },
    ]
  }

  // Assignee
  if (lowerQuery.includes('unassigned') || lowerQuery.includes('no assignee')) {
    filters.assignee = null
  }

  // Sprint
  if (lowerQuery.includes('uncommitted') || lowerQuery.includes('no sprint')) {
    filters.OR = [
      { sprint: null },
      { sprint: { contains: 'Backlog', mode: 'insensitive' } },
    ]
  }

  // Priority
  if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent')) {
    filters.priority = { in: ['High', 'Highest', 'Critical'], mode: 'insensitive' }
  } else if (lowerQuery.includes('low priority')) {
    filters.priority = { in: ['Low', 'Lowest'], mode: 'insensitive' }
  }

  // Due date
  if (lowerQuery.includes('overdue') || lowerQuery.includes('past due')) {
    filters.dueDate = { lt: new Date() }
    filters.status = { not: { contains: 'Done', mode: 'insensitive' } }
  }

  // Issue type
  if (lowerQuery.includes('bug') || lowerQuery.includes('defect')) {
    filters.issueType = { contains: 'Bug', mode: 'insensitive' }
  } else if (lowerQuery.includes('story') || lowerQuery.includes('user story')) {
    filters.issueType = { contains: 'Story', mode: 'insensitive' }
  } else if (lowerQuery.includes('epic')) {
    filters.issueType = { contains: 'Epic', mode: 'insensitive' }
  }

  return filters
}

/**
 * Generate insights from matched issues
 */
function generateInsights(issues: any[], query: string) {
  const insights = {
    totalMatched: issues.length,
    byStatus: {} as Record<string, number>,
    byTeam: {} as Record<string, number>,
    bySprint: {} as Record<string, number>,
    byAssignee: {} as Record<string, number>,
    missingStoryPoints: 0,
    totalStoryPoints: 0,
    averageStoryPoints: 0,
    highPriorityCount: 0,
    overdueCount: 0,
  }

  const now = new Date()

  for (const issue of issues) {
    // Status
    if (issue.status) {
      insights.byStatus[issue.status] = (insights.byStatus[issue.status] || 0) + 1
    }
    
    // Team
    if (issue.team) {
      insights.byTeam[issue.team] = (insights.byTeam[issue.team] || 0) + 1
    }
    
    // Sprint
    if (issue.sprint) {
      insights.bySprint[issue.sprint] = (insights.bySprint[issue.sprint] || 0) + 1
    }
    
    // Assignee
    if (issue.assignee) {
      insights.byAssignee[issue.assignee] = (insights.byAssignee[issue.assignee] || 0) + 1
    } else {
      insights.byAssignee['Unassigned'] = (insights.byAssignee['Unassigned'] || 0) + 1
    }
    
    // Story points
    if (issue.storyPoints) {
      insights.totalStoryPoints += issue.storyPoints
    } else {
      insights.missingStoryPoints++
    }
    
    // Priority
    if (issue.priority && ['High', 'Highest', 'Critical'].includes(issue.priority)) {
      insights.highPriorityCount++
    }
    
    // Overdue
    if (issue.dueDate && new Date(issue.dueDate) < now && !issue.status?.toLowerCase().includes('done')) {
      insights.overdueCount++
    }
  }

  if (insights.totalStoryPoints > 0) {
    insights.averageStoryPoints = Math.round(
      (insights.totalStoryPoints / (issues.length - insights.missingStoryPoints)) * 10
    ) / 10
  }

  return insights
}
