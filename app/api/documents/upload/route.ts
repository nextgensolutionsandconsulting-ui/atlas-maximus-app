
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/s3"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Unsupported file type. Please upload PDF, Word, PowerPoint, Image, or Text files." 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, file.name)

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        originalName: file.name,
        cloudStoragePath,
        fileType: file.type,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: 'PENDING'
      }
    })

    // Start processing the document in the background
    processDocumentAsync(document.id, cloudStoragePath, file.type)

    return NextResponse.json({
      message: "File uploaded successfully",
      document: {
        id: document.id,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        processingStatus: document.processingStatus,
        uploadedAt: document.uploadedAt.toISOString()
      }
    })

  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload document" }, 
      { status: 500 }
    )
  }
}

// Background document processing function
async function processDocumentAsync(documentId: string, cloudStoragePath: string, fileType: string) {
  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'PROCESSING' }
    })

    // Import the document processor
    const { extractDocumentText } = await import('@/lib/document-processor')
    
    // Extract text from document
    const result = await extractDocumentText(cloudStoragePath, fileType)

    if (result.error) {
      throw new Error(result.error)
    }

    // Update document with extracted text
    await prisma.document.update({
      where: { id: documentId },
      data: { 
        processingStatus: 'COMPLETED',
        extractedText: result.extractedText,
        processedAt: new Date()
      }
    })

    console.log(`Document ${documentId} processed successfully. Word count: ${result.wordCount}`)

  } catch (error) {
    console.error("Document processing error:", error)
    
    // Update status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: { 
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error'
      }
    }).catch(console.error)
  }
}
