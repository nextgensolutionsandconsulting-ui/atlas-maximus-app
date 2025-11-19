

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface DocumentReference {
  name: string
  relevance: number
}

// Enhanced search that handles policy-type questions better
function findRelevantPolicyContent(
  documents: Array<{ 
    id?: string
    originalName: string
    extractedText: string | null 
  }>,
  query: string
): { 
  context: string
  sources: DocumentReference[]
  confidence: "high" | "medium" | "low"
} {
  if (!documents || documents.length === 0) {
    return { 
      context: "No documents available to search.",
      sources: [],
      confidence: "low"
    }
  }

  const queryLower = query.toLowerCase()
  
  // Extract key terms and policy indicators from the query
  const policyIndicators = [
    'define', 'definition', 'policy', 'process', 'procedure', 'guideline',
    'standard', 'rule', 'requirement', 'criteria', 'practice', 'agreement',
    'who', 'what', 'when', 'where', 'how', 'why'
  ]
  
  const hasPolicyIndicator = policyIndicators.some(indicator => 
    queryLower.includes(indicator)
  )

  // Extract keywords (ignore common words)
  const commonWords = ['the', 'is', 'are', 'do', 'we', 'our', 'what', 'how', 'who', 'when', 'where', 'why', 'does']
  const keywords = queryLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))

  // Score each document
  const scoredDocs = documents
    .filter(doc => doc.extractedText && doc.extractedText.length > 0)
    .map(doc => {
      const textLower = (doc.extractedText || '').toLowerCase()
      let score = 0
      let matchDetails = {
        exactPhraseMatch: false,
        keywordMatches: 0,
        policyTermMatches: 0,
        contextualRelevance: 0
      }

      // 1. Check for exact phrase match (highest weight)
      if (textLower.includes(queryLower)) {
        score += 100
        matchDetails.exactPhraseMatch = true
      }

      // 2. Check for partial phrase matches
      const queryParts = queryLower.split(/\s+/).filter(w => w.length > 3)
      for (let i = 0; i < queryParts.length - 1; i++) {
        const phrase = `${queryParts[i]} ${queryParts[i + 1]}`
        if (textLower.includes(phrase)) {
          score += 30
        }
      }

      // 3. Keyword matching with proximity boost
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi')
        const matches = (textLower.match(regex) || []).length
        if (matches > 0) {
          score += matches * 10
          matchDetails.keywordMatches += matches
        }
      })

      // 4. Policy term matching
      policyIndicators.forEach(indicator => {
        if (textLower.includes(indicator)) {
          score += 5
          matchDetails.policyTermMatches++
        }
      })

      // 5. Contextual relevance (look for definitions, lists, procedures)
      if (textLower.match(/definition:|defined as|means:|refers to:/i)) {
        score += 20
        matchDetails.contextualRelevance += 20
      }
      if (textLower.match(/policy:|procedure:|process:|guideline:/i)) {
        score += 15
        matchDetails.contextualRelevance += 15
      }
      if (textLower.match(/\d+\.\s|\-\s|\•\s/)) { // Lists
        score += 10
        matchDetails.contextualRelevance += 10
      }

      return { 
        ...doc, 
        score, 
        matchDetails,
        relevance: 0 // Will calculate after normalization
      }
    })
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scoredDocs.length === 0) {
    return { 
      context: "No relevant information found in your documents.",
      sources: [],
      confidence: "low"
    }
  }

  // Normalize scores to 0-1 range for relevance
  const maxScore = scoredDocs[0].score
  scoredDocs.forEach(doc => {
    doc.relevance = maxScore > 0 ? doc.score / maxScore : 0
  })

  // Determine confidence based on top match
  const topRelevance = scoredDocs[0].relevance
  const confidence: "high" | "medium" | "low" = 
    topRelevance >= 0.7 ? "high" :
    topRelevance >= 0.4 ? "medium" :
    "low"

  // Build context from top documents
  let context = ''
  const sources: DocumentReference[] = []
  const maxDocs = 3

  for (const doc of scoredDocs.slice(0, maxDocs)) {
    const docText = doc.extractedText || ''
    
    // Extract the most relevant excerpt
    const excerpt = extractMostRelevantExcerpt(docText, keywords, queryLower, 800)
    
    if (excerpt) {
      context += `\n\n### From: ${doc.originalName}\n${excerpt}\n`
      sources.push({
        name: doc.originalName,
        relevance: doc.relevance
      })
    }
  }

  return { context, sources, confidence }
}

// Extract the most relevant excerpt around the query terms
function extractMostRelevantExcerpt(
  text: string,
  keywords: string[],
  query: string,
  maxChars: number
): string {
  const textLower = text.toLowerCase()
  
  // First, try to find the exact query
  let bestPosition = textLower.indexOf(query)
  
  // If not found, find position with most keywords
  if (bestPosition === -1) {
    let maxKeywords = 0
    const chunkSize = 500
    
    for (let i = 0; i < text.length - chunkSize; i += 100) {
      const chunk = text.slice(i, i + chunkSize).toLowerCase()
      const keywordCount = keywords.filter(kw => chunk.includes(kw)).length
      
      if (keywordCount > maxKeywords) {
        maxKeywords = keywordCount
        bestPosition = i
      }
    }
  }

  // Extract excerpt around the best position
  const start = Math.max(0, bestPosition - maxChars / 2)
  const end = Math.min(text.length, bestPosition + maxChars / 2)
  
  let excerpt = text.slice(start, end).trim()
  
  // Clean up the excerpt
  // Try to start and end at sentence boundaries
  if (start > 0) {
    const firstPeriod = excerpt.indexOf('. ')
    if (firstPeriod > 0 && firstPeriod < 100) {
      excerpt = excerpt.slice(firstPeriod + 2)
    }
    excerpt = '...' + excerpt
  }
  
  if (end < text.length) {
    const lastPeriod = excerpt.lastIndexOf('. ')
    if (lastPeriod > excerpt.length - 100) {
      excerpt = excerpt.slice(0, lastPeriod + 1)
    }
    excerpt = excerpt + '...'
  }

  return excerpt
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query } = await req.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Fetch ALL documents (user's own + community-shared)
    const allDocuments = await prisma.document.findMany({
      where: {
        processingStatus: 'COMPLETED',
        OR: [
          { userId: session.user.id },
          { isSharedWithCommunity: true }
        ]
      },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
      },
      orderBy: {
        usageCount: 'desc'
      }
    })

    // Find relevant content
    const { context, sources, confidence } = findRelevantPolicyContent(
      allDocuments,
      query
    )

    // Get user's experience level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { experienceLevel: true, agileRole: true }
    })

    // Build system prompt for focused policy answers
    const systemPrompt = `You are Atlas Maximus, an expert Agile assistant. A user is asking a specific question about their team's policies, processes, or definitions.

User Role: ${user?.agileRole?.replace(/_/g, ' ') || 'Team Member'}
Experience Level: ${user?.experienceLevel || 'INTERMEDIATE'}

Your task is to provide a DIRECT, CONCISE answer based ONLY on the information provided below from their documents.

Key guidelines:
- Answer the question directly and specifically
- If the information is in the documents, cite it clearly
- If the information is NOT in the documents, say so clearly
- Keep the answer focused and actionable
- Use bullet points or numbered lists for clarity
- Don't add general Agile advice unless the documents don't have the answer

${context ? `
RELEVANT INFORMATION FROM DOCUMENTS:
${context}

Base your answer primarily on the above information.
` : `
NO RELEVANT INFORMATION FOUND IN DOCUMENTS.
Provide a brief, general Agile best practice answer and suggest that the user upload relevant policy documents.
`}

Question: ${query}`

    // Call LLM to generate answer
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 800,
        temperature: 0.3 // Lower temperature for more focused answers
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate an answer."

    // Track usage of documents
    if (sources.length > 0) {
      const documentIds = allDocuments
        .filter(doc => sources.some(s => s.name === doc.originalName))
        .map(doc => doc.id)
        .filter(Boolean) as string[]

      if (documentIds.length > 0) {
        // Fire and forget
        prisma.document.updateMany({
          where: { id: { in: documentIds } },
          data: { usageCount: { increment: 1 } }
        }).catch(console.error)
      }
    }

    return NextResponse.json({
      answer,
      sources,
      confidence,
      query
    })

  } catch (error) {
    console.error('Knowledge query error:', error)
    return NextResponse.json(
      { error: "Failed to process query" }, 
      { status: 500 }
    )
  }
}
