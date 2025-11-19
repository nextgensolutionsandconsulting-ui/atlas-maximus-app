
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EvidenceType } from "@prisma/client"

// Tag documents with evidence types
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { documentId, evidenceType, evidenceTags, complianceNotes, retentionPeriod } = body

    if (!documentId || !evidenceType) {
      return NextResponse.json(
        { error: "Document ID and evidence type are required" },
        { status: 400 }
      )
    }

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Calculate expiry date if retention period is provided
    let expiryDate = null
    if (retentionPeriod) {
      expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + retentionPeriod)
    }

    // Update document with evidence metadata
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        evidenceType: evidenceType as EvidenceType,
        evidenceTags: evidenceTags || [],
        complianceNotes: complianceNotes || null,
        retentionPeriod: retentionPeriod || null,
        expiryDate
      }
    })

    // Create audit trail entry
    await prisma.auditTrailEntry.create({
      data: {
        documentId,
        userId: session.user.id,
        actionType: "DOCUMENT_TAGGED",
        entityType: "Document",
        entityId: documentId,
        details: {
          evidenceType,
          evidenceTags,
          previousEvidenceType: document.evidenceType
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      document: updatedDocument 
    })

  } catch (error) {
    console.error("Evidence tagging error:", error)
    return NextResponse.json(
      { error: "Failed to tag document" }, 
      { status: 500 }
    )
  }
}

// Get documents by evidence type
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const evidenceType = searchParams.get('evidenceType')

    const where: any = {
      userId: session.user.id
    }

    if (evidenceType && evidenceType !== 'ALL') {
      where.evidenceType = evidenceType as EvidenceType
    } else if (evidenceType !== 'ALL') {
      where.evidenceType = { not: null }
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        uploadedAt: 'desc'
      },
      select: {
        id: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        evidenceType: true,
        evidenceTags: true,
        complianceNotes: true,
        retentionPeriod: true,
        expiryDate: true,
        uploadedAt: true,
        lastAccessedAt: true,
        accessCount: true
      }
    })

    return NextResponse.json({ documents })

  } catch (error) {
    console.error("Evidence fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch evidence documents" }, 
      { status: 500 }
    )
  }
}
