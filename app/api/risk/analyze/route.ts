
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { analyzeTeamRisk, calculateAndSaveRiskScore } from "@/lib/risk-analyzer"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, sprint, saveResult } = await req.json()

    if (!teamId || !sprint) {
      return NextResponse.json(
        { error: "teamId and sprint are required" },
        { status: 400 }
      )
    }

    // Verify team belongs to user
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        userId: session.user.id
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or unauthorized" },
        { status: 404 }
      )
    }

    // Analyze risk
    const analysis = await analyzeTeamRisk(teamId, sprint)

    // Optionally save the result
    if (saveResult) {
      await calculateAndSaveRiskScore(teamId, sprint)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing team risk:', error)
    return NextResponse.json(
      { error: "Failed to analyze team risk" },
      { status: 500 }
    )
  }
}
