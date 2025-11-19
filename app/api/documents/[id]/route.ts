
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { deleteFile } from "@/lib/s3"

// GET document status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documentId = params.id

    // Get document to verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: document.id,
      originalName: document.originalName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      processingStatus: document.processingStatus,
      extractedText: document.extractedText,
      uploadedAt: document.uploadedAt.toISOString(),
      processedAt: document.processedAt?.toISOString()
    })

  } catch (error) {
    console.error("Document fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch document" }, 
      { status: 500 }
    )
  }
}

// DELETE document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documentId = params.id

    // Get document to verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from S3
    try {
      await deleteFile(document.cloudStoragePath)
    } catch (error) {
      console.error("S3 delete error:", error)
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ message: "Document deleted successfully" })

  } catch (error) {
    console.error("Document delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete document" }, 
      { status: 500 }
    )
  }
}
