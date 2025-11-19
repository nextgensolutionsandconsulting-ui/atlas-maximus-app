
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET coaching plan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const coachingPlan = await prisma.coachingPlan.findUnique({
      where: { userId: session.user.id },
      include: {
        observations: {
          where: { isResolved: false },
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        },
        interventions: {
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!coachingPlan) {
      return NextResponse.json({
        exists: false,
        message: "No coaching plan found. Run analysis to generate one.",
      })
    }

    return NextResponse.json({
      exists: true,
      coachingPlan,
    })
  } catch (error) {
    console.error("Error fetching coaching plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch coaching plan" },
      { status: 500 }
    )
  }
}
