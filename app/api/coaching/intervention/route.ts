
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// UPDATE intervention status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { interventionId, status, notes } = body

    if (!interventionId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify intervention belongs to user
    const intervention = await prisma.coachingIntervention.findUnique({
      where: { id: interventionId },
      include: { plan: true },
    })

    if (!intervention || intervention.plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Intervention not found" },
        { status: 404 }
      )
    }

    // Update intervention
    const updated = await prisma.coachingIntervention.update({
      where: { id: interventionId },
      data: {
        status,
        notes: notes || intervention.notes,
        startedAt: status === "IN_PROGRESS" && !intervention.startedAt
          ? new Date()
          : intervention.startedAt,
        completedAt: status === "COMPLETED"
          ? new Date()
          : status === "IN_PROGRESS"
          ? null
          : intervention.completedAt,
      },
    })

    return NextResponse.json({
      success: true,
      intervention: updated,
    })
  } catch (error) {
    console.error("Error updating intervention:", error)
    return NextResponse.json(
      { error: "Failed to update intervention" },
      { status: 500 }
    )
  }
}
