
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { searchConversationHistory } from "@/lib/conversation-memory"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const results = await searchConversationHistory({
      query,
      userId: session.user.id,
      sessionLimit: 10
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error searching conversation history:', error)
    return NextResponse.json(
      { error: "Failed to search conversation history" },
      { status: 500 }
    )
  }
}
