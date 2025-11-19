
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/s3"
import { parseJiraData, analyzeJiraDataset } from "@/lib/jira-parser"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Dataset name is required" }, { status: 400 })
    }

    // Validate file type
    const supportedTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV or Excel files." },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse Jira data
    let parsedIssues
    try {
      parsedIssues = parseJiraData(buffer, file.type)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to parse file: ${error.message}` },
        { status: 400 }
      )
    }

    if (parsedIssues.length === 0) {
      return NextResponse.json(
        { error: "No valid issues found in the file" },
        { status: 400 }
      )
    }

    // Upload file to S3
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const s3Key = `jira-uploads/${session.user.id}/${timestamp}-${sanitizedFileName}`
    
    const cloudStoragePath = await uploadFile(buffer, s3Key)

    // Determine source type
    let sourceType: 'CSV_UPLOAD' | 'EXCEL_UPLOAD' = 'CSV_UPLOAD'
    if (file.type.includes('sheet') || file.type.includes('excel')) {
      sourceType = 'EXCEL_UPLOAD'
    }

    // Create dataset and issues in database
    const dataset = await prisma.jiraDataset.create({
      data: {
        userId: session.user.id,
        name,
        description: description || undefined,
        sourceType,
        uploadedFile: cloudStoragePath,
        issueCount: parsedIssues.length,
        isActive: true,
        issues: {
          create: parsedIssues.map(issue => ({
            issueKey: issue.issueKey,
            summary: issue.summary,
            description: issue.description,
            issueType: issue.issueType,
            status: issue.status,
            priority: issue.priority,
            storyPoints: issue.storyPoints,
            assignee: issue.assignee,
            reporter: issue.reporter,
            team: issue.team,
            sprint: issue.sprint,
            epic: issue.epic,
            labels: issue.labels || [],
            dueDate: issue.dueDate,
            createdDate: issue.createdDate,
            updatedDate: issue.updatedDate,
            resolvedDate: issue.resolvedDate,
            customFields: issue.customFields,
          })),
        },
      },
      include: {
        issues: true,
      },
    })

    // Analyze dataset
    const analysis = analyzeJiraDataset(parsedIssues)

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        issueCount: dataset.issueCount,
      },
      analysis,
    })
  } catch (error: any) {
    console.error("Jira upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload Jira data" },
      { status: 500 }
    )
  }
}
