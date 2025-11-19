
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { CoachingAnalyzer } from "@/lib/coaching-analyzer"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Gather data for analysis
    const [jiraDatasets, documents, conversations] = await Promise.all([
      // Get Jira data
      prisma.jiraDataset.findMany({
        where: { userId, isActive: true },
        include: { issues: true },
      }),
      // Get uploaded documents
      prisma.document.findMany({
        where: {
          userId,
          processingStatus: "COMPLETED",
        },
        orderBy: { uploadedAt: "desc" },
        take: 50,
      }),
      // Get recent conversations
      prisma.conversation.findMany({
        where: { userId, isActive: true },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 100,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ])

    // Flatten Jira issues
    const jiraIssues = jiraDatasets.flatMap((ds) => ds.issues)

    // Analyze the data
    const insights = await CoachingAnalyzer.analyzeTeamData({
      jiraIssues: jiraIssues.length > 0 ? jiraIssues : undefined,
      documents: documents.length > 0 ? documents : undefined,
      conversationHistory: conversations.length > 0 ? conversations : undefined,
      userProfile: session.user,
    })

    // Check if coaching plan exists
    let coachingPlan = await prisma.coachingPlan.findUnique({
      where: { userId },
      include: {
        observations: true,
        interventions: true,
        assessments: true,
      },
    })

    if (coachingPlan) {
      // Update existing plan
      await prisma.coachingPlan.update({
        where: { userId },
        data: {
          focusAreas: insights.focusAreas,
          currentMaturityLevel: insights.overallMaturity,
          updatedAt: new Date(),
        },
      })

      // Delete old observations and assessments (keep interventions for tracking)
      await prisma.coachingObservation.deleteMany({
        where: { planId: coachingPlan.id },
      })
      await prisma.maturityAssessment.deleteMany({
        where: { planId: coachingPlan.id },
      })
    } else {
      // Create new plan
      coachingPlan = await prisma.coachingPlan.create({
        data: {
          userId,
          focusAreas: insights.focusAreas,
          currentMaturityLevel: insights.overallMaturity,
          targetMaturityLevel: "PERFORMING",
        },
        include: {
          observations: true,
          interventions: true,
          assessments: true,
        },
      })
    }

    // Create new observations
    if (insights.observations.length > 0) {
      await prisma.coachingObservation.createMany({
        data: insights.observations.map((obs) => ({
          planId: coachingPlan!.id,
          category: obs.category,
          severity: obs.severity,
          title: obs.title,
          description: obs.description,
          dataSource: obs.dataSource || null,
          dataEvidence: obs.dataEvidence || null,
          affectedAreas: obs.affectedAreas,
        })),
      })
    }

    // Create new assessments
    if (insights.assessments.length > 0) {
      await prisma.maturityAssessment.createMany({
        data: insights.assessments.map((assessment) => ({
          planId: coachingPlan!.id,
          assessmentType: assessment.assessmentType,
          category: assessment.category,
          currentScore: assessment.currentScore,
          previousScore: assessment.previousScore || null,
          maturityLevel: assessment.maturityLevel,
          strengths: assessment.strengths,
          weaknesses: assessment.weaknesses,
          recommendations: assessment.recommendations,
          dataAnalyzed: assessment.dataAnalyzed || null,
        })),
      })
    }

    // Create new interventions (only if they don't exist)
    const existingInterventions = await prisma.coachingIntervention.findMany({
      where: { planId: coachingPlan.id },
    })

    const newInterventions = insights.interventions.filter(
      (intervention) =>
        !existingInterventions.some(
          (existing) => existing.title === intervention.title
        )
    )

    if (newInterventions.length > 0) {
      await prisma.coachingIntervention.createMany({
        data: newInterventions.map((intervention) => ({
          planId: coachingPlan!.id,
          observationIds: intervention.observationIds,
          title: intervention.title,
          description: intervention.description,
          actionItems: intervention.actionItems as any,
          priority: intervention.priority,
          estimatedImpact: intervention.estimatedImpact,
          estimatedEffort: intervention.estimatedEffort,
        })),
      })
    }

    // Fetch updated plan
    const updatedPlan = await prisma.coachingPlan.findUnique({
      where: { userId },
      include: {
        observations: {
          orderBy: { severity: "desc" },
        },
        interventions: {
          orderBy: { priority: "desc" },
        },
        assessments: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return NextResponse.json({
      success: true,
      coachingPlan: updatedPlan,
      summary: {
        observationsCount: insights.observations.length,
        interventionsCount: insights.interventions.length,
        assessmentsCount: insights.assessments.length,
        overallMaturity: insights.overallMaturity,
        focusAreas: insights.focusAreas,
      },
    })
  } catch (error) {
    console.error("Error analyzing coaching data:", error)
    return NextResponse.json(
      { error: "Failed to analyze coaching data" },
      { status: 500 }
    )
  }
}
