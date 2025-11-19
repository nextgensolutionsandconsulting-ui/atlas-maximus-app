
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateRecentSessionsSummary, generateTopicSummary } from "@/lib/conversation-memory"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionCount = parseInt(searchParams.get('count') || '3')
    const topic = searchParams.get('topic')

    let summary: string

    if (topic) {
      summary = await generateTopicSummary(session.user.id, topic)
    } else {
      summary = await generateRecentSessionsSummary(session.user.id, sessionCount)
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
