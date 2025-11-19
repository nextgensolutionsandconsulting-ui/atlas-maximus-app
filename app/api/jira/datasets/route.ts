
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * GET - List all datasets for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const datasets = await prisma.jiraDataset.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        sourceType: true,
        issueCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ datasets })
  } catch (error: any) {
    console.error("Error fetching datasets:", error)
    return NextResponse.json(
      { error: "Failed to fetch datasets" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a dataset
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const datasetId = searchParams.get('id')

    if (!datasetId) {
      return NextResponse.json({ error: "Dataset ID is required" }, { status: 400 })
    }

    // Verify ownership
    const dataset = await prisma.jiraDataset.findFirst({
      where: {
        id: datasetId,
        userId: session.user.id,
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    // Delete dataset (cascade will delete all issues)
    await prisma.jiraDataset.delete({
      where: { id: datasetId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting dataset:", error)
    return NextResponse.json(
      { error: "Failed to delete dataset" },
      { status: 500 }
    )
  }
}
