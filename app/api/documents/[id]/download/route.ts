
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { downloadFile } from "@/lib/s3"

// GET document download URL
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

    // Get signed download URL
    const downloadUrl = await downloadFile(document.cloudStoragePath)

    return NextResponse.json({ 
      downloadUrl,
      originalName: document.originalName 
    })

  } catch (error) {
    console.error("Document download error:", error)
    return NextResponse.json(
      { error: "Failed to generate download URL" }, 
      { status: 500 }
    )
  }
}
