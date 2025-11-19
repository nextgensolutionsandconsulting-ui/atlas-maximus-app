
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Vote on a contribution (helpful/not helpful)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contributionId, isHelpful } = await req.json()

    if (!contributionId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.contributionVote.findUnique({
      where: {
        userId_contributionId: {
          userId: session.user.id,
          contributionId
        }
      }
    })

    if (existingVote) {
      // Update existing vote
      await prisma.contributionVote.update({
        where: {
          userId_contributionId: {
            userId: session.user.id,
            contributionId
          }
        },
        data: {
          isHelpful
        }
      })
    } else {
      // Create new vote
      await prisma.contributionVote.create({
        data: {
          userId: session.user.id,
          contributionId,
          isHelpful
        }
      })
    }

    // Update the contribution's helpful count
    const helpfulVotes = await prisma.contributionVote.count({
      where: {
        contributionId,
        isHelpful: true
      }
    })

    await prisma.userContribution.update({
      where: { id: contributionId },
      data: {
        helpfulCount: helpfulVotes
      }
    })

    return NextResponse.json({ success: true, helpfulCount: helpfulVotes })
  } catch (error) {
    console.error('Error voting on contribution:', error)
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    )
  }
}
