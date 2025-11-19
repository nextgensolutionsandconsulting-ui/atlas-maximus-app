
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowById } from '@/lib/workflows'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { workflowId, documentIds } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    const workflow = getWorkflowById(workflowId)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Get user documents
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        documents: {
          where: documentIds?.length > 0 
            ? { id: { in: documentIds } }
            : undefined,
          select: {
            id: true,
            originalName: true,
            extractedText: true,
            fileType: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare context from documents
    console.log(`Found ${user.documents.length} documents for user ${user.email}`)
    
    // Filter documents with valid extracted text
    const validDocuments = user.documents.filter(
      (doc: { extractedText: string | null }) => 
        doc.extractedText && 
        doc.extractedText.length > 100 &&
        !doc.extractedText.includes('Document processed successfully. Text extraction')
    )
    
    console.log(`Documents with valid text: ${validDocuments.length}`)
    
    const documentContext = validDocuments
      .map((doc: { originalName: string; extractedText: string | null }) => 
        `Document: ${doc.originalName}\nContent: ${doc.extractedText}`)
      .join('\n\n---\n\n')

    console.log(`Document context length: ${documentContext.length} characters`)

    if (!documentContext || documentContext.length < 500) {
      return NextResponse.json(
        { error: `Insufficient document content for workflow analysis. Please ensure your documents have been processed successfully. (Found ${validDocuments.length} valid documents with ${documentContext.length} characters of text)` },
        { status: 400 }
      )
    }

    // Execute workflow steps
    const results = []
    const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY

    if (!ABACUSAI_API_KEY) {
      return NextResponse.json(
        { error: 'LLM API not configured' },
        { status: 500 }
      )
    }

    for (const step of workflow.steps) {
      // Combine document context with step prompt
      const systemPrompt = `You are Atlas Maximus, an expert Agile coach helping with ${workflow.name}. You have access to the user's uploaded documents.`
      
      const userPrompt = `${step.prompt}

DOCUMENTS:
${documentContext}

Please analyze the documents and ${step.description.toLowerCase()}.${step.outputFormat === 'json' ? ' Respond with valid JSON only.' : ''}`

      // Call LLM API
      let response
      try {
        response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ABACUSAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        })
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Network error while calling LLM API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('LLM API error response:', errorText)
        throw new Error(`LLM API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      const stepResult = data.choices[0].message.content

      results.push({
        stepId: step.id,
        stepName: step.name,
        result: stepResult
      })
    }

    // Combine results into final output
    const finalOutput = results[results.length - 1].result

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        outputType: workflow.outputType
      },
      steps: results,
      finalOutput,
      documentsAnalyzed: validDocuments.length
    })

  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}
