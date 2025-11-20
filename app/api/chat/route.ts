export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      message,
      agileRole,
      conversationHistory,
      recentAttachment,
      jiraMode,
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error (missing API key)" },
        { status: 500 }
      );
    }

    // Import necessary modules
    const { prisma } = await import("@/lib/db");
    const {
      findRelevantDocumentContent,
      findRelevantUserContributions,
    } = await import("@/lib/document-processor");
    const {
      getOrCreateActiveSession,
      addMessageToSession,
      extractInsights,
      generateRecentSessionsSummary,
    } = await import("@/lib/conversation-memory");

    // Check if user is asking about conversation history/memory
    const isMemoryQuery =
      /what did we|last time|previous|remember|discussed before|last session|retro|past conversation/i.test(
        message
      );

    // Get or create active session
    const sessionId = await getOrCreateActiveSession(
      session.user.id,
      agileRole
    );

    // If asking about memory, retrieve and return conversation summary
    if (isMemoryQuery) {
      try {
        const memorySummary = await generateRecentSessionsSummary(
          session.user.id,
          3
        );

        return NextResponse.json({
          response: memorySummary,
          isMemoryResponse: true,
        });
      } catch (error) {
        console.error("Error generating memory summary:", error);
        // Continue with normal chat if memory retrieval fails
      }
    }

    // Fetch user's experience level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { experienceLevel: true },
    });
    const experienceLevel = user?.experienceLevel || "INTERMEDIATE";

    // Fetch ALL shared community documents + user's own documents
    const allDocuments = await prisma.document.findMany({
      where: {
        processingStatus: "COMPLETED",
        OR: [
          { userId: session.user.id }, // User's own documents
          { isSharedWithCommunity: true }, // All community-shared documents
        ],
      },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
        isTemplate: true,
        templateCategory: true,
        userId: true,
        fileType: true,
        cloudStoragePath: true,
        uploadedAt: true,
        user: {
          select: {
            name: true,
            agileRole: true,
          },
        },
      },
      orderBy: {
        usageCount: "desc",
      },
      take: 50,
    });

    // Fetch relevant user contributions from the community
    const userContributions = await prisma.userContribution.findMany({
      where: {
        isPublic: true,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            agileRole: true,
          },
        },
      },
      orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    // Separate image documents from text documents
    const imageDocuments = allDocuments.filter((doc: any) =>
      doc.fileType?.startsWith("image/")
    );
    const textDocuments = allDocuments.filter(
      (doc: any) => !doc.fileType?.startsWith("image/")
    );

    // Find relevant document context based on the user's message
    let documentsToSearch = textDocuments;
    if (recentAttachment && !recentAttachment.type?.startsWith("image/")) {
      const recentDoc = textDocuments.find(
        (doc: any) => doc.id === recentAttachment.id
      );
      if (recentDoc) {
        documentsToSearch = [
          recentDoc,
          ...textDocuments.filter((doc: any) => doc.id !== recentAttachment.id),
        ];
      }
    }

    // Search through text documents for the best knowledge
    const { context: documentContext, usedDocumentIds } =
      findRelevantDocumentContent(
        documentsToSearch as any,
        message,
        3000 // Max 3000 characters of document context
      );

    // Find relevant images based on the message
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { createS3Client, getBucketConfig } = await import(
      "@/lib/aws-config"
    );

    let relevantImages: Array<{ name: string; url: string }> = [];

    const isImageQuery =
      /image|picture|photo|diagram|chart|visual|screenshot|show|see|look at|upload|this|analyze|what|view/i.test(
        message
      );
    const hasRecentAttachment =
      recentAttachment && recentAttachment.type?.startsWith("image/");

    if ((isImageQuery || hasRecentAttachment) && imageDocuments.length > 0) {
      const s3Client = createS3Client();
      const { bucketName } = getBucketConfig();

      if (hasRecentAttachment) {
        const attachedImage = imageDocuments.find(
          (doc: any) => doc.id === recentAttachment.id
        );
        if (attachedImage) {
          try {
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: attachedImage.cloudStoragePath,
            });

            const signedUrl = await getSignedUrl(s3Client, command, {
              expiresIn: 3600,
            });
            relevantImages.push({
              name: attachedImage.originalName,
              url: signedUrl,
            });

            usedDocumentIds.push(attachedImage.id);
          } catch (error) {
            console.error(
              "Error generating signed URL for attached image:",
              error
            );
          }
        }
      } else {
        const recentImages = imageDocuments
          .sort(
            (a: any, b: any) =>
              new Date(b.uploadedAt).getTime() -
              new Date(a.uploadedAt).getTime()
          )
          .slice(0, 2);

        for (const img of recentImages) {
          try {
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: img.cloudStoragePath,
            });

            const signedUrl = await getSignedUrl(s3Client, command, {
              expiresIn: 3600,
            });
            relevantImages.push({
              name: img.originalName,
              url: signedUrl,
            });

            usedDocumentIds.push(img.id);
          } catch (error) {
            console.error("Error generating signed URL for image:", error);
          }
        }
      }
    }

    // Track document usage for analytics
    if (usedDocumentIds.length > 0) {
      prisma.document
        .updateMany({
          where: { id: { in: usedDocumentIds } },
          data: { usageCount: { increment: 1 } },
        })
        .catch(console.error);
    }

    // Find relevant user contributions
    const contributionContext = findRelevantUserContributions(
      userContributions as any,
      message,
      2000
    );

    // Jira Mode: Query Jira data if enabled
    let jiraContext = "";
    let jiraInsights = null;
    if (jiraMode) {
      try {
        const jiraDatasets = await prisma.jiraDataset.findMany({
          where: {
            userId: session.user.id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (jiraDatasets.length > 0) {
          const jiraQuery = await fetch(
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/jira/query`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: req.headers.get("cookie") || "",
              },
              body: JSON.stringify({
                query: message,
              }),
            }
          );

          if (jiraQuery.ok) {
            const jiraData = await jiraQuery.json();
            jiraInsights = jiraData.insights;

            if (jiraData.matchedIssues > 0) {
              jiraContext = `
JIRA DATA ANALYSIS (${jiraData.matchedIssues} issues matched):

Query: "${jiraData.query}"

INSIGHTS:
- Total Matched Issues: ${jiraData.insights.totalMatched}
- Missing Story Points: ${jiraData.insights.missingStoryPoints}
- High Priority Issues: ${jiraData.insights.highPriorityCount}
- Overdue Issues: ${jiraData.insights.overdueCount}
- Average Story Points: ${jiraData.insights.averageStoryPoints}

STATUS BREAKDOWN:
${Object.entries(jiraData.insights.byStatus as Record<string, number>)
  .map(([status, count]) => `  - ${status}: ${count}`)
  .join("\n")}

${
  Object.keys(jiraData.insights.byTeam as Record<string, number>).length > 0
    ? `
TEAM BREAKDOWN:
${Object.entries(jiraData.insights.byTeam as Record<string, number>)
  .map(([team, count]) => `  - ${team}: ${count} issues`)
  .join("\n")}
`
    : ""
}

${
  Object.keys(jiraData.insights.bySprint as Record<string, number>).length > 0
    ? `
SPRINT BREAKDOWN:
${Object.entries(jiraData.insights.bySprint as Record<string, number>)
  .map(([sprint, count]) => `  - ${sprint}: ${count} issues`)
  .join("\n")}
`
    : ""
}

${
  Object.keys(
    jiraData.insights.byAssignee as Record<string, number>
  ).length > 0
    ? `
ASSIGNEE BREAKDOWN:
${Object.entries(
  jiraData.insights.byAssignee as Record<string, number>
)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([assignee, count]) => `  - ${assignee}: ${count} issues`)
  .join("\n")}
`
    : ""
}

TOP MATCHING ISSUES (up to 10):
${jiraData.issues
  .slice(0, 10)
  .map(
    (issue: any, idx: number) => `
${idx + 1}. ${issue.issueKey}: ${issue.summary}
   Status: ${issue.status || "N/A"} | Type: ${
      issue.issueType || "N/A"
    } | Points: ${issue.storyPoints || "None"}
   Assignee: ${issue.assignee || "Unassigned"} | Team: ${
      issue.team || "N/A"
    }
   Sprint: ${issue.sprint || "Uncommitted"}
`
  )
  .join("")}

Based on this Jira data, provide actionable insights and recommendations for the user's question.
`;
            }
          }
        } else {
          jiraContext =
            "\n\nNOTE: Jira Mode is enabled but no Jira datasets found. Suggest the user upload Jira data in the Jira tab first.\n";
        }
      } catch (error) {
        console.error("Error querying Jira data:", error);
      }
    }

    // Build context-aware system prompt
    const roleContext = {
      SCRUM_MASTER:
        "You are helping a Scrum Master with facilitation, sprint planning, and team dynamics.",
      PRODUCT_OWNER:
        "You are helping a Product Owner with backlog management, user stories, and stakeholder communication.",
      DEVELOPER:
        "You are helping a Developer with technical practices, story implementation, and agile development.",
      TESTER:
        "You are helping a Tester with agile testing practices, acceptance criteria, and quality assurance.",
      AGILE_COACH:
        "You are helping an Agile Coach with transformation, coaching techniques, and organizational change.",
      RELEASE_TRAIN_ENGINEER:
        "You are helping an RTE with SAFe practices, program increment planning, and scaled agile.",
      SOLUTION_TRAIN_ENGINEER:
        "You are helping an STE with solution-level coordination and large-scale agile practices.",
    };

    const experienceGuidance = {
      BEGINNER: `This user is NEW to Agile (learning fundamentals). Tailor your responses by:
- Explaining foundational concepts clearly without assuming prior knowledge
- Breaking down complex ideas into simple, digestible steps
- Providing clear definitions and examples for Agile terminology
- Offering encouragement and celebrating small wins
- Using analogies and real-world comparisons to explain abstract concepts
- Suggesting starter resources and foundational practices
- Being patient with basic questions and providing thorough explanations`,
      INTERMEDIATE: `This user has 1-3 YEARS of Agile experience (comfortable with basics). Tailor your responses by:
- Building on foundational knowledge they already have
- Introducing intermediate techniques and best practices
- Discussing common challenges and how to overcome them
- Providing practical tips for improving existing processes
- Sharing scenarios that help deepen understanding
- Suggesting ways to expand their skills and take on more responsibility`,
      ADVANCED: `This user has 3-5 YEARS of experience (leading teams/initiatives). Tailor your responses by:
- Discussing advanced strategies and optimization techniques
- Focusing on leadership, influence, and scaling practices
- Addressing organizational challenges and change management
- Providing insights on coaching and mentoring team members
- Exploring edge cases and complex scenarios
- Suggesting ways to drive continuous improvement and innovation
- Discussing metrics, measurement, and demonstrating value`,
      EXPERT: `This user has 5+ YEARS of deep expertise (coaching others). Tailor your responses by:
- Engaging at a peer-to-peer level with sophisticated concepts
- Discussing enterprise-level transformations and strategic initiatives
- Exploring nuanced challenges in scaled agile environments
- Sharing insights on organizational culture and systemic change
- Discussing thought leadership and influencing at executive levels
- Addressing complex scenarios involving multiple teams/programs
- Suggesting innovative approaches and emerging practices
- Respecting their expertise while offering fresh perspectives`,
    };

    const systemPrompt = `You are Atlas Maximus, a professional and knowledgeable Agile learning companion with image viewing capability. ${
      (roleContext as any)[agileRole as keyof typeof roleContext] ||
      "You are helping with general Agile practices."
    }

ROLE-AWARE EXPERT MODE ACTIVE:
User Role: ${agileRole?.replace(/_/g, " ") || "Team Member"}
Experience Level: ${experienceLevel}

${
  (experienceGuidance as any)[
    experienceLevel as keyof typeof experienceGuidance
  ]
}

Key guidelines:
- Be conversational, supportive, and encouraging
- Provide practical, actionable advice
- Reference Scrum Guide, SAFe, and other agile frameworks when relevant
- Ask clarifying questions to better understand their situation
- Use examples and scenarios to illustrate concepts
- Keep responses focused and digestible
- Show empathy for common agile challenges
- When images are provided, analyze them carefully and provide detailed insights about what you see
- For Agile artifacts in images (boards, charts, diagrams), explain key elements and offer constructive feedback

${
  documentContext
    ? `
ATLAS COMMUNITY KNOWLEDGE BASE:
Atlas has access to ${allDocuments.length} document(s) shared by the community, including training materials, templates, and reference guides uploaded by users. You have relevant excerpts from these shared documents below. This collective knowledge helps provide accurate, practical guidance based on real-world materials.

${documentContext}

When referencing documents, you can say things like:
- "According to the Scrum Guide in our knowledge base..."
- "I found this in an Agile training document..."
- "Based on the PI Planning materials shared by the community..."
- "This Sprint Planning template shows..."

This shows users that your knowledge comes from trusted, real training materials.
`
    : ""
}

${
  contributionContext
    ? `
COMMUNITY KNOWLEDGE - REAL-WORLD EXPERIENCES:
Atlas has learned from other users who have shared their real-world experiences, solutions, and best practices. Below are relevant contributions from the Atlas community that might help answer this question:

${contributionContext}

When using insights from community contributions, you can reference them naturally (e.g., "Many Atlas users have found success with...", "One experienced Scrum Master shared that...", or "A common approach that works well is..."). This shows that the advice is battle-tested and validated by real practitioners.
`
    : ""
}

${
  jiraContext
    ? `
JIRA MODE ACTIVE - ASK ME ANYTHING FROM YOUR BACKLOG:
Atlas is now analyzing your actual Jira data to answer questions about your backlog, sprints, and team performance. Below is the analysis of your Jira issues based on your question:

${jiraContext}

When answering:
- Provide specific, data-driven insights from the Jira analysis above
- Highlight patterns, trends, and areas of concern
- Offer actionable recommendations to address issues
- Reference specific issue keys when relevant (e.g., "PROJ-123 is missing story points")
- Help identify blockers, risks, and opportunities
- Use tables or bullet points to present data clearly
`
    : ""
}

TEMPLATE GENERATION CAPABILITY:
When users request templates, documents, or downloadable resources, inform them that you can generate professional templates in multiple formats:
- Excel (.xlsx) - for user story backlogs, sprint planning sheets, etc.
- PowerPoint (.pptx) - for presentations, training materials, etc.
- Word (.docx) - for documentation, user stories, process guides, etc.
- PDF (.pdf) - for formal documents, checklists, etc.

When a user asks for a template, provide a download link in this exact format:
[Download Template](/api/templates/generate?type=TYPE&name=NAME)

Where:
- TYPE is one of: excel, powerpoint, word, pdf
- NAME is a URL-encoded template name (e.g., "Sprint_Planning_Template")

Example: "I can create a Sprint Planning template for you! [Download Sprint Planning Template](/api/templates/generate?type=excel&name=Sprint_Planning_Template)"

Available template suggestions:
- User Story Backlog (Excel)
- Sprint Planning Sheet (Excel)
- Definition of Done Checklist (Word/PDF)
- Agile Principles Presentation (PowerPoint)
- Retrospective Template (Word/PDF)
- PI Planning Agenda (PowerPoint)
- Release Planning Document (Word)
- Velocity Tracking Sheet (Excel)

Current context: The user is a ${
      agileRole?.replace(/_/g, " ") || "team member"
    } seeking guidance.`;

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-6).forEach((msg: any) => {
        if (msg?.role && msg?.content) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }
      });
    }

    // Add current message with images if available
    if (relevantImages.length > 0) {
      let noteText = message;
      if (recentAttachment && recentAttachment.type?.startsWith("image/")) {
        noteText += `\n\n[User just uploaded this image: "${relevantImages[0].name}". Please view and analyze it in detail.]`;
      } else {
        noteText += `\n\n[Note: ${
          relevantImages.length
        } relevant image(s) found. Image names: ${relevantImages
          .map((img) => img.name)
          .join(", ")}]`;
      }

      const contentParts: any[] = [
        {
          type: "text",
          text: noteText,
        },
      ];

      relevantImages.forEach((img) => {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: img.url,
            detail: "high",
          },
        });
      });

      messages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      let noteText = message;
      if (recentAttachment && !recentAttachment.type?.startsWith("image/")) {
        noteText += `\n\n[User just uploaded a document: "${recentAttachment.name}". This document's content is included in the knowledge base above. Please reference it in your response.]`;
      }

      messages.push({
        role: "user",
        content: noteText,
      });
    }

    // Use gpt-4o for vision, gpt-4o-mini otherwise
    const modelToUse = relevantImages.length > 0 ? "gpt-4o" : "gpt-4o-mini";

    // Call OpenAI Chat Completions API with streaming
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          stream: true,
          max_tokens: relevantImages.length > 0 ? 2000 : 1500,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<no body>");
      console.error(
        "LLM API error:",
        response.status,
        errorBody.substring(0, 500)
      );
      throw new Error(`LLM API error: ${response.status}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } =
              (await reader?.read()) || { done: true, value: undefined };
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content =
                    parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Save user message to session (async, don't wait)
    addMessageToSession(sessionId, message, "USER").catch(console.error);

    let fullResponse = "";

    const enhancedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullResponse += chunk;

            controller.enqueue(encoder.encode(chunk));
          }

          await addMessageToSession(sessionId, fullResponse, "ASSISTANT");

          const recentMessages = await prisma.sessionMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
            take: 10,
          });
          await extractInsights(sessionId, recentMessages);
        } catch (error) {
          console.error("Enhanced stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(enhancedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
