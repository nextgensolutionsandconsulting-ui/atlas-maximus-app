
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teamId, sprint, objective, confidenceLevel, votedBy, notes } = await req.json()

    if (!teamId || !sprint || !objective || !confidenceLevel || !votedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const vote = await prisma.teamConfidenceVote.create({
      data: {
        teamId,
        sprint,
        objective,
        confidenceLevel,
        votedBy,
        notes
      }
    })

    return NextResponse.json({ vote })
  } catch (error) {
    console.error('Error recording confidence vote:', error)
    return NextResponse.json(
      { error: "Failed to record confidence vote" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const sprint = searchParams.get('sprint')

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 })
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

    const votes = await prisma.teamConfidenceVote.findMany({
      where: {
        teamId,
        ...(sprint && { sprint })
      },
      orderBy: { votedAt: 'desc' }
    })

    return NextResponse.json({ votes })
  } catch (error) {
    console.error('Error fetching confidence votes:', error)
    return NextResponse.json(
      { error: "Failed to fetch confidence votes" },
      { status: 500 }
    )
  }
}
