
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getRiskColor } from "@/lib/risk-analyzer"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sprint = searchParams.get('sprint')

    // Get all teams for the user
    const teams = await prisma.team.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        riskScores: sprint ? {
          where: { sprint },
          orderBy: { calculatedAt: 'desc' },
          take: 1
        } : {
          orderBy: { calculatedAt: 'desc' },
          take: 1
        },
        confidenceVotes: sprint ? {
          where: { sprint },
          orderBy: { votedAt: 'desc' }
        } : undefined,
        objectives: sprint ? {
          where: { sprint }
        } : undefined
      }
    })

    // Format response with risk colors
    const teamsWithRisk = teams.map(team => {
      const latestRiskScore = team.riskScores[0]
      
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        currentSprint: team.currentSprint,
        members: team.members,
        riskScore: latestRiskScore,
        riskColors: latestRiskScore ? getRiskColor(latestRiskScore.riskLevel) : null,
        confidenceVoteCount: team.confidenceVotes?.length || 0,
        objectiveCount: team.objectives?.length || 0
      }
    })

    // Sort by risk level (CRITICAL first)
    teamsWithRisk.sort((a, b) => {
      const riskOrder = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 }
      const aRisk = a.riskScore?.riskLevel ? riskOrder[a.riskScore.riskLevel as keyof typeof riskOrder] || 0 : 0
      const bRisk = b.riskScore?.riskLevel ? riskOrder[b.riskScore.riskLevel as keyof typeof riskOrder] || 0 : 0
      return bRisk - aRisk
    })

    return NextResponse.json({ teams: teamsWithRisk })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, members, sprintLength, currentSprint } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        userId: session.user.id,
        name,
        description,
        members: members || [],
        sprintLength: sprintLength || 14,
        currentSprint
      }
    })

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    )
  }
}
