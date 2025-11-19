

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { extractDocumentText } from "@/lib/document-processor"

/**
 * Reprocess all existing documents to extract text content
 * This is useful for documents that were uploaded before text extraction was implemented
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all user documents that need reprocessing
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { processingStatus: 'PENDING' },
          { processingStatus: 'FAILED' },
          {
            AND: [
              { processingStatus: 'COMPLETED' },
              {
                OR: [
                  { extractedText: null },
                  { extractedText: '' },
                  { extractedText: { contains: 'Document processed successfully. Text extraction would be implemented here.' } },
                  { extractedText: { contains: 'Text file content would be extracted here' } }
                ]
              }
            ]
          }
        ]
      }
    })

    if (documents.length === 0) {
      return NextResponse.json({
        message: "All documents are already processed",
        reprocessed: 0
      })
    }

    // Reprocess each document
    const results = {
      success: 0,
      failed: 0,
      total: documents.length
    }

    for (const doc of documents) {
      try {
        // Update status to processing
        await prisma.document.update({
          where: { id: doc.id },
          data: { processingStatus: 'PROCESSING' }
        })

        // Extract text from document
        const result = await extractDocumentText(doc.cloudStoragePath, doc.fileType)

        if (result.error) {
          throw new Error(result.error)
        }

        // Update document with extracted text
        await prisma.document.update({
          where: { id: doc.id },
          data: { 
            processingStatus: 'COMPLETED',
            extractedText: result.extractedText,
            processedAt: new Date()
          }
        })

        results.success++
        console.log(`Reprocessed document ${doc.id} (${doc.originalName}): ${result.wordCount} words extracted`)

      } catch (error) {
        console.error(`Failed to reprocess document ${doc.id}:`, error)
        
        // Update status to failed
        await prisma.document.update({
          where: { id: doc.id },
          data: { 
            processingStatus: 'FAILED',
            processingError: error instanceof Error ? error.message : 'Unknown error during reprocessing'
          }
        }).catch(console.error)

        results.failed++
      }
    }

    return NextResponse.json({
      message: `Reprocessing complete. ${results.success} succeeded, ${results.failed} failed.`,
      results
    })

  } catch (error) {
    console.error("Document reprocessing error:", error)
    return NextResponse.json(
      { error: "Failed to reprocess documents" }, 
      { status: 500 }
    )
  }
}
