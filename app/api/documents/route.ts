

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET all documents for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all documents for the user
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      select: {
        id: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        processingStatus: true,
        uploadedAt: true,
        processedAt: true,
        extractedText: true
      }
    })

    // Format the response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      processingStatus: doc.processingStatus,
      uploadedAt: doc.uploadedAt.toISOString(),
      processedAt: doc.processedAt?.toISOString(),
      extractedText: doc.extractedText
    }))

    return NextResponse.json({ documents: formattedDocuments })

  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" }, 
      { status: 500 }
    )
  }
}
