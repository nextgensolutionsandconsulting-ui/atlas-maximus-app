
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - Fetch all public contributions (for display/moderation)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const contributionType = searchParams.get('type')
    const agileRole = searchParams.get('role')

    const where: any = {
      isPublic: true,
      isApproved: true
    }

    if (contributionType) {
      where.contributionType = contributionType
    }

    if (agileRole) {
      where.agileRole = agileRole
    }

    const contributions = await prisma.userContribution.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            agileRole: true
          }
        }
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({ contributions })
  } catch (error) {
    console.error('Error fetching contributions:', error)
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}

// POST - Create a new contribution
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      contributionType,
      originalQuestion,
      atlasResponse,
      userExperience,
      scenario,
      tags,
      conversationId,
      messageId,
      isPublic = true
    } = await req.json()

    if (!contributionType || !originalQuestion || !userExperience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate tags if not provided
    const generatedTags = tags || generateTagsFromText(originalQuestion + ' ' + userExperience)

    const contribution = await prisma.userContribution.create({
      data: {
        userId: session.user.id,
        contributionType,
        originalQuestion,
        atlasResponse,
        userExperience,
        scenario,
        agileRole: session.user.agileRole,
        tags: generatedTags,
        conversationId,
        messageId,
        isPublic,
        isApproved: true // Auto-approve for now
      },
      include: {
        user: {
          select: {
            name: true,
            agileRole: true
          }
        }
      }
    })

    return NextResponse.json({ contribution }, { status: 201 })
  } catch (error) {
    console.error('Error creating contribution:', error)
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    )
  }
}

// Helper function to generate tags from text
function generateTagsFromText(text: string): string[] {
  const commonAgileTerms = [
    'sprint', 'scrum', 'retrospective', 'backlog', 'user story', 'standup',
    'velocity', 'burndown', 'definition of done', 'acceptance criteria',
    'product owner', 'scrum master', 'sprint planning', 'sprint review',
    'epic', 'feature', 'technical debt', 'refinement', 'estimation',
    'safe', 'program increment', 'pi planning', 'art', 'release train',
    'kanban', 'continuous integration', 'continuous delivery', 'devops',
    'agile coach', 'transformation', 'team dynamics', 'communication',
    'testing', 'quality', 'automation', 'integration'
  ]

  const lowerText = text.toLowerCase()
  const foundTags: string[] = []

  for (const term of commonAgileTerms) {
    if (lowerText.includes(term.toLowerCase()) && !foundTags.includes(term)) {
      foundTags.push(term)
    }
  }

  // Limit to top 10 most relevant tags
  return foundTags.slice(0, 10)
}
