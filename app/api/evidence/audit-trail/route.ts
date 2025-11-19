
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Generate and export audit trail
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const actionType = searchParams.get('actionType')
    const documentId = searchParams.get('documentId')

    // Build query
    const where: any = {
      userId: session.user.id
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    if (actionType) {
      where.actionType = actionType
    }

    if (documentId) {
      where.documentId = documentId
    }

    // Fetch audit trail entries
    const entries = await prisma.auditTrailEntry.findMany({
      where,
      include: {
        document: {
          select: {
            originalName: true,
            evidenceType: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        fullName: true,
        agileRole: true
      }
    })

    // Create audit trail entry for this export
    await prisma.auditTrailEntry.create({
      data: {
        userId: session.user.id,
        actionType: "AUDIT_TRAIL_GENERATED",
        entityType: "AuditTrail",
        entityId: `export-${Date.now()}`,
        details: {
          format,
          entryCount: entries.length,
          filters: { startDate, endDate, actionType, documentId }
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    })

    // Format response based on requested format
    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Timestamp', 'Action Type', 'Entity Type', 'Entity ID', 'Document Name', 'Evidence Type', 'IP Address', 'User Agent', 'Details'].join(',')
      ]

      entries.forEach(entry => {
        const row = [
          entry.timestamp.toISOString(),
          entry.actionType,
          entry.entityType,
          entry.entityId,
          entry.document?.originalName || 'N/A',
          entry.document?.evidenceType || 'N/A',
          entry.ipAddress || 'N/A',
          entry.userAgent || 'N/A',
          JSON.stringify(entry.details || {}).replace(/"/g, '""')
        ]
        csvRows.push(row.map(field => `"${field}"`).join(','))
      })

      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-trail-${Date.now()}.csv"`
        }
      })
    }

    // Return JSON format
    return NextResponse.json({
      user: {
        email: user?.email,
        name: user?.fullName,
        role: user?.agileRole
      },
      generatedAt: new Date().toISOString(),
      entryCount: entries.length,
      filters: { startDate, endDate, actionType, documentId },
      entries: entries.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        actionType: entry.actionType,
        entityType: entry.entityType,
        entityId: entry.entityId,
        documentName: entry.document?.originalName,
        evidenceType: entry.document?.evidenceType,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: entry.details
      }))
    })

  } catch (error) {
    console.error("Audit trail generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate audit trail" }, 
      { status: 500 }
    )
  }
}

// Get audit trail statistics
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get statistics
    const totalEntries = await prisma.auditTrailEntry.count({
      where: { userId: session.user.id }
    })

    const actionTypeCounts = await prisma.auditTrailEntry.groupBy({
      by: ['actionType'],
      where: { userId: session.user.id },
      _count: true
    })

    const evidenceTypeCounts = await prisma.document.groupBy({
      by: ['evidenceType'],
      where: { 
        userId: session.user.id,
        evidenceType: { not: null }
      },
      _count: true
    })

    const recentActivity = await prisma.auditTrailEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        document: {
          select: {
            originalName: true,
            evidenceType: true
          }
        }
      }
    })

    return NextResponse.json({
      totalEntries,
      actionTypeCounts: actionTypeCounts.map(item => ({
        actionType: item.actionType,
        count: item._count
      })),
      evidenceTypeCounts: evidenceTypeCounts.map(item => ({
        evidenceType: item.evidenceType,
        count: item._count
      })),
      recentActivity: recentActivity.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        actionType: entry.actionType,
        documentName: entry.document?.originalName,
        evidenceType: entry.document?.evidenceType
      }))
    })

  } catch (error) {
    console.error("Audit trail statistics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" }, 
      { status: 500 }
    )
  }
}
