
import {
  MaturityLevel,
  ObservationCategory,
  SeverityLevel,
  PriorityLevel,
  ImpactLevel,
  EffortLevel,
  AssessmentType,
} from "@prisma/client"

export interface TeamDataInput {
  jiraIssues?: any[]
  documents?: any[]
  conversationHistory?: any[]
  userProfile?: any
}

export interface CoachingInsight {
  observations: ObservationData[]
  interventions: InterventionData[]
  assessments: AssessmentData[]
  overallMaturity: MaturityLevel
  focusAreas: string[]
}

export interface ObservationData {
  category: ObservationCategory
  severity: SeverityLevel
  title: string
  description: string
  dataSource?: string
  dataEvidence?: any
  affectedAreas: string[]
}

export interface InterventionData {
  observationIds: string[]
  title: string
  description: string
  actionItems: ActionItem[]
  priority: PriorityLevel
  estimatedImpact: ImpactLevel
  estimatedEffort: EffortLevel
}

export interface ActionItem {
  title: string
  description: string
  resources?: string[]
}

export interface AssessmentData {
  assessmentType: AssessmentType
  category: string
  currentScore: number
  previousScore?: number
  maturityLevel: MaturityLevel
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  dataAnalyzed?: any
}

export class CoachingAnalyzer {
  /**
   * Analyze team data and generate coaching insights
   */
  static async analyzeTeamData(data: TeamDataInput): Promise<CoachingInsight> {
    const observations: ObservationData[] = []
    const assessments: AssessmentData[] = []

    // Analyze Jira data if available
    if (data.jiraIssues && data.jiraIssues.length > 0) {
      const jiraInsights = this.analyzeJiraData(data.jiraIssues)
      observations.push(...jiraInsights.observations)
      assessments.push(...jiraInsights.assessments)
    }

    // Analyze uploaded documents
    if (data.documents && data.documents.length > 0) {
      const docInsights = this.analyzeDocuments(data.documents)
      observations.push(...docInsights.observations)
      assessments.push(...docInsights.assessments)
    }

    // Analyze conversation patterns
    if (data.conversationHistory && data.conversationHistory.length > 0) {
      const conversationInsights = this.analyzeConversationPatterns(
        data.conversationHistory
      )
      observations.push(...conversationInsights.observations)
    }

    // Calculate overall maturity level
    const overallMaturity = this.calculateMaturityLevel(assessments)

    // Generate interventions based on observations
    const interventions = this.generateInterventions(observations)

    // Identify focus areas
    const focusAreas = this.identifyFocusAreas(observations)

    return {
      observations,
      interventions,
      assessments,
      overallMaturity,
      focusAreas,
    }
  }

  /**
   * Analyze Jira issues for patterns and anti-patterns
   */
  private static analyzeJiraData(issues: any[]): {
    observations: ObservationData[]
    assessments: AssessmentData[]
  } {
    const observations: ObservationData[] = []
    const assessments: AssessmentData[] = []

    // Analyze story quality
    const storyAnalysis = this.analyzeStoryQuality(issues)
    observations.push(...storyAnalysis.observations)
    assessments.push(storyAnalysis.assessment)

    // Analyze sprint health
    const sprintAnalysis = this.analyzeSprintHealth(issues)
    observations.push(...sprintAnalysis.observations)
    assessments.push(sprintAnalysis.assessment)

    // Analyze velocity patterns
    const velocityAnalysis = this.analyzeVelocityPatterns(issues)
    observations.push(...velocityAnalysis.observations)
    assessments.push(velocityAnalysis.assessment)

    return { observations, assessments }
  }

  /**
   * Analyze story quality (AC, descriptions, etc.)
   */
  private static analyzeStoryQuality(issues: any[]): {
    observations: ObservationData[]
    assessment: AssessmentData
  } {
    const observations: ObservationData[] = []
    const stories = issues.filter(
      (i) => i.issueType?.toLowerCase() === "story" || i.issueType?.toLowerCase() === "user story"
    )

    let score = 70 // Start with a baseline score

    // Check for shallow descriptions
    const shallowDescriptions = stories.filter(
      (s) => !s.description || s.description.length < 50
    )
    if (shallowDescriptions.length > stories.length * 0.3) {
      observations.push({
        category: ObservationCategory.STORY_ACCEPTANCE_CRITERIA,
        severity: SeverityLevel.HIGH,
        title: "Many stories have shallow or missing descriptions",
        description: `${shallowDescriptions.length} out of ${stories.length} stories (${Math.round((shallowDescriptions.length / stories.length) * 100)}%) lack detailed descriptions. Well-written user stories should include context, user needs, and clear business value.`,
        dataSource: "Jira Analysis",
        dataEvidence: {
          totalStories: stories.length,
          shallowCount: shallowDescriptions.length,
          examples: shallowDescriptions.slice(0, 3).map((s) => s.issueKey),
        },
        affectedAreas: ["Sprint Planning", "User Stories", "Team Understanding"],
      })
      score -= 15
    }

    // Check for missing acceptance criteria
    const missingAC = stories.filter(
      (s) =>
        !s.description?.toLowerCase().includes("acceptance criteria") &&
        !s.description?.toLowerCase().includes("ac:") &&
        !s.description?.toLowerCase().includes("done when")
    )
    if (missingAC.length > stories.length * 0.4) {
      observations.push({
        category: ObservationCategory.STORY_ACCEPTANCE_CRITERIA,
        severity: SeverityLevel.CRITICAL,
        title: "Acceptance Criteria frequently missing from stories",
        description: `${missingAC.length} out of ${stories.length} stories (${Math.round((missingAC.length / stories.length) * 100)}%) don't have clear acceptance criteria. This leads to ambiguity, rework, and misalignment between developers and stakeholders.`,
        dataSource: "Jira Analysis",
        dataEvidence: {
          totalStories: stories.length,
          missingACCount: missingAC.length,
          examples: missingAC.slice(0, 3).map((s) => s.issueKey),
        },
        affectedAreas: ["Definition of Done", "Quality", "Team Alignment"],
      })
      score -= 20
    }

    // Check for story points
    const missingStoryPoints = stories.filter(
      (s) => !s.storyPoints || s.storyPoints === 0
    )
    if (missingStoryPoints.length > stories.length * 0.2) {
      observations.push({
        category: ObservationCategory.SPRINT_PLANNING,
        severity: SeverityLevel.MEDIUM,
        title: "Story pointing is inconsistent",
        description: `${missingStoryPoints.length} out of ${stories.length} stories lack story points. Consistent estimation helps with sprint planning and velocity tracking.`,
        dataSource: "Jira Analysis",
        dataEvidence: {
          totalStories: stories.length,
          missingPointsCount: missingStoryPoints.length,
        },
        affectedAreas: ["Sprint Planning", "Velocity Tracking"],
      })
      score -= 10
    }

    const maturityLevel =
      score >= 85
        ? MaturityLevel.PERFORMING
        : score >= 70
        ? MaturityLevel.NORMING
        : score >= 50
        ? MaturityLevel.STORMING
        : MaturityLevel.FORMING

    return {
      observations,
      assessment: {
        assessmentType: AssessmentType.JIRA_ANALYSIS,
        category: "User Story Quality",
        currentScore: Math.max(0, Math.min(100, score)),
        maturityLevel,
        strengths: this.generateStoryStrengths(stories, observations),
        weaknesses: observations.map((o) => o.title),
        recommendations: this.generateStoryRecommendations(observations),
        dataAnalyzed: {
          totalStories: stories.length,
          analysisDate: new Date().toISOString(),
        },
      },
    }
  }

  /**
   * Analyze sprint health
   */
  private static analyzeSprintHealth(issues: any[]): {
    observations: ObservationData[]
    assessment: AssessmentData
  } {
    const observations: ObservationData[] = []
    let score = 75

    // Group by sprint
    const sprintMap = new Map<string, any[]>()
    issues.forEach((issue) => {
      if (issue.sprint) {
        if (!sprintMap.has(issue.sprint)) {
          sprintMap.set(issue.sprint, [])
        }
        sprintMap.get(issue.sprint)?.push(issue)
      }
    })

    if (sprintMap.size > 0) {
      // Calculate completion rates
      const sprintStats = Array.from(sprintMap.entries()).map(
        ([sprint, sprintIssues]) => {
          const done = sprintIssues.filter(
            (i) =>
              i.status?.toLowerCase() === "done" ||
              i.status?.toLowerCase() === "closed"
          ).length
          const total = sprintIssues.length
          return {
            sprint,
            completionRate: total > 0 ? (done / total) * 100 : 0,
            total,
            done,
          }
        }
      )

      const avgCompletionRate =
        sprintStats.reduce((sum, s) => sum + s.completionRate, 0) /
        sprintStats.length

      if (avgCompletionRate < 70) {
        observations.push({
          category: ObservationCategory.TEAM_VELOCITY,
          severity: SeverityLevel.HIGH,
          title: "Sprint completion rate is below healthy threshold",
          description: `Average sprint completion rate is ${avgCompletionRate.toFixed(1)}%. Healthy teams typically complete 80-90% of committed work. This may indicate over-commitment, unclear requirements, or blockers.`,
          dataSource: "Jira Analysis",
          dataEvidence: {
            avgCompletionRate: avgCompletionRate.toFixed(1),
            sprintStats: sprintStats.slice(-3), // Last 3 sprints
          },
          affectedAreas: ["Sprint Planning", "Capacity Planning", "Predictability"],
        })
        score -= 20
      }

      // Check for carry-over work
      const carryOverIssues = issues.filter(
        (i) => i.sprint && i.status?.toLowerCase() !== "done"
      )
      if (carryOverIssues.length > issues.length * 0.3) {
        observations.push({
          category: ObservationCategory.SPRINT_PLANNING,
          severity: SeverityLevel.MEDIUM,
          title: "High volume of carry-over work between sprints",
          description: `${carryOverIssues.length} items are being carried over. This suggests stories may be too large, commitments are too optimistic, or blockers aren't being resolved quickly.`,
          dataSource: "Jira Analysis",
          dataEvidence: {
            carryOverCount: carryOverIssues.length,
            totalCount: issues.length,
          },
          affectedAreas: ["Sprint Planning", "Story Sizing", "Team Capacity"],
        })
        score -= 15
      }
    }

    const maturityLevel =
      score >= 85
        ? MaturityLevel.PERFORMING
        : score >= 70
        ? MaturityLevel.NORMING
        : score >= 50
        ? MaturityLevel.STORMING
        : MaturityLevel.FORMING

    return {
      observations,
      assessment: {
        assessmentType: AssessmentType.JIRA_ANALYSIS,
        category: "Sprint Health",
        currentScore: Math.max(0, Math.min(100, score)),
        maturityLevel,
        strengths: this.generateSprintStrengths(sprintMap, observations),
        weaknesses: observations.map((o) => o.title),
        recommendations: this.generateSprintRecommendations(observations),
        dataAnalyzed: {
          totalSprints: sprintMap.size,
          totalIssues: issues.length,
        },
      },
    }
  }

  /**
   * Analyze velocity patterns
   */
  private static analyzeVelocityPatterns(issues: any[]): {
    observations: ObservationData[]
    assessment: AssessmentData
  } {
    const observations: ObservationData[] = []
    let score = 70

    // Calculate velocity by sprint
    const sprintVelocity = new Map<string, number>()
    issues.forEach((issue) => {
      if (
        issue.sprint &&
        issue.storyPoints &&
        (issue.status?.toLowerCase() === "done" ||
          issue.status?.toLowerCase() === "closed")
      ) {
        const current = sprintVelocity.get(issue.sprint) || 0
        sprintVelocity.set(issue.sprint, current + issue.storyPoints)
      }
    })

    if (sprintVelocity.size >= 3) {
      const velocities = Array.from(sprintVelocity.values())
      const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
      const variance =
        velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) /
        velocities.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = (stdDev / avgVelocity) * 100

      // High velocity variance indicates unpredictability
      if (coefficientOfVariation > 40) {
        observations.push({
          category: ObservationCategory.TEAM_VELOCITY,
          severity: SeverityLevel.HIGH,
          title: "Velocity is highly variable and unpredictable",
          description: `Velocity varies by ${coefficientOfVariation.toFixed(1)}% (coefficient of variation). Stable teams typically have variation below 25%. This unpredictability makes planning difficult and suggests inconsistent team capacity, varying story complexity, or external interruptions.`,
          dataSource: "Jira Analysis",
          dataEvidence: {
            avgVelocity: avgVelocity.toFixed(1),
            stdDev: stdDev.toFixed(1),
            coefficientOfVariation: coefficientOfVariation.toFixed(1),
            recentVelocities: velocities.slice(-5),
          },
          affectedAreas: ["Predictability", "Sprint Planning", "Team Stability"],
        })
        score -= 20
      } else if (coefficientOfVariation > 25) {
        observations.push({
          category: ObservationCategory.TEAM_VELOCITY,
          severity: SeverityLevel.MEDIUM,
          title: "Velocity shows moderate variability",
          description: `Velocity varies by ${coefficientOfVariation.toFixed(1)}%. While not critical, reducing this variation to below 25% will improve planning accuracy.`,
          dataSource: "Jira Analysis",
          dataEvidence: {
            avgVelocity: avgVelocity.toFixed(1),
            coefficientOfVariation: coefficientOfVariation.toFixed(1),
          },
          affectedAreas: ["Predictability", "Sprint Planning"],
        })
        score -= 10
      } else {
        score += 10 // Reward for stable velocity
      }
    }

    const maturityLevel =
      score >= 85
        ? MaturityLevel.PERFORMING
        : score >= 70
        ? MaturityLevel.NORMING
        : score >= 50
        ? MaturityLevel.STORMING
        : MaturityLevel.FORMING

    return {
      observations,
      assessment: {
        assessmentType: AssessmentType.JIRA_ANALYSIS,
        category: "Velocity & Predictability",
        currentScore: Math.max(0, Math.min(100, score)),
        maturityLevel,
        strengths: this.generateVelocityStrengths(sprintVelocity, observations),
        weaknesses: observations.map((o) => o.title),
        recommendations: this.generateVelocityRecommendations(observations),
        dataAnalyzed: {
          sprintCount: sprintVelocity.size,
          analysisDate: new Date().toISOString(),
        },
      },
    }
  }

  /**
   * Analyze uploaded documents for coaching insights
   */
  private static analyzeDocuments(documents: any[]): {
    observations: ObservationData[]
    assessments: AssessmentData[]
  } {
    const observations: ObservationData[] = []
    const assessments: AssessmentData[] = []

    // Look for retrospective patterns
    const retroDocs = documents.filter(
      (d) =>
        d.originalName.toLowerCase().includes("retro") ||
        d.extractedText?.toLowerCase().includes("retrospective") ||
        d.extractedText?.toLowerCase().includes("what went well")
    )

    if (retroDocs.length > 0) {
      const retroAnalysis = this.analyzeRetrospectives(retroDocs)
      observations.push(...retroAnalysis.observations)
      assessments.push(retroAnalysis.assessment)
    }

    // Look for planning documents
    const planningDocs = documents.filter(
      (d) =>
        d.originalName.toLowerCase().includes("planning") ||
        d.originalName.toLowerCase().includes("pi planning") ||
        d.extractedText?.toLowerCase().includes("sprint planning")
    )

    if (planningDocs.length > 0) {
      const planningAnalysis = this.analyzePlanningDocuments(planningDocs)
      observations.push(...planningAnalysis.observations)
      assessments.push(planningAnalysis.assessment)
    }

    return { observations, assessments }
  }

  /**
   * Analyze retrospective documents
   */
  private static analyzeRetrospectives(retroDocs: any[]): {
    observations: ObservationData[]
    assessment: AssessmentData
  } {
    const observations: ObservationData[] = []
    let score = 70

    // Check for action items
    const hasActionItems = retroDocs.some(
      (doc) =>
        doc.extractedText?.toLowerCase().includes("action item") ||
        doc.extractedText?.toLowerCase().includes("action:") ||
        doc.extractedText?.toLowerCase().includes("todo")
    )

    if (!hasActionItems) {
      observations.push({
        category: ObservationCategory.RETROSPECTIVE_QUALITY,
        severity: SeverityLevel.CRITICAL,
        title: "Retrospectives lack clear action items",
        description:
          "Your retrospective documents don't contain clear action items. Retrospectives should always result in concrete, actionable improvements. Without follow-up actions, retrospectives become just complaint sessions that don't drive change.",
        dataSource: "Document Analysis",
        affectedAreas: ["Continuous Improvement", "Team Engagement", "Retrospectives"],
      })
      score -= 25
    }

    // Check for depth of discussion
    const shallowRetros = retroDocs.filter(
      (doc) => !doc.extractedText || doc.extractedText.length < 500
    )

    if (shallowRetros.length > retroDocs.length * 0.5) {
      observations.push({
        category: ObservationCategory.RETROSPECTIVE_QUALITY,
        severity: SeverityLevel.HIGH,
        title: "Retrospectives appear shallow or rushed",
        description: `${shallowRetros.length} out of ${retroDocs.length} retrospective documents are very brief. Effective retrospectives require thoughtful discussion, root cause analysis, and team engagement. Brief notes suggest the team may be going through the motions.`,
        dataSource: "Document Analysis",
        affectedAreas: ["Team Engagement", "Continuous Improvement"],
      })
      score -= 15
    }

    const maturityLevel =
      score >= 85
        ? MaturityLevel.PERFORMING
        : score >= 70
        ? MaturityLevel.NORMING
        : score >= 50
        ? MaturityLevel.STORMING
        : MaturityLevel.FORMING

    return {
      observations,
      assessment: {
        assessmentType: AssessmentType.DOCUMENT_ANALYSIS,
        category: "Retrospective Quality",
        currentScore: Math.max(0, Math.min(100, score)),
        maturityLevel,
        strengths: this.generateRetroStrengths(retroDocs, observations),
        weaknesses: observations.map((o) => o.title),
        recommendations: this.generateRetroRecommendations(observations),
        dataAnalyzed: {
          documentCount: retroDocs.length,
        },
      },
    }
  }

  /**
   * Analyze planning documents
   */
  private static analyzePlanningDocuments(planningDocs: any[]): {
    observations: ObservationData[]
    assessment: AssessmentData
  } {
    const observations: ObservationData[] = []
    let score = 75

    // Check for risk identification
    const hasRisks = planningDocs.some(
      (doc) =>
        doc.extractedText?.toLowerCase().includes("risk") ||
        doc.extractedText?.toLowerCase().includes("blocker") ||
        doc.extractedText?.toLowerCase().includes("dependency")
    )

    if (!hasRisks) {
      observations.push({
        category: ObservationCategory.RISK_MANAGEMENT,
        severity: SeverityLevel.HIGH,
        title: "Planning sessions don't identify risks or dependencies",
        description:
          "Your planning documents don't show evidence of risk identification or dependency management. Mature teams proactively identify risks, dependencies, and potential blockers during planning.",
        dataSource: "Document Analysis",
        affectedAreas: ["Risk Management", "Sprint Planning", "PI Planning"],
      })
      score -= 20
    }

    const maturityLevel =
      score >= 85
        ? MaturityLevel.PERFORMING
        : score >= 70
        ? MaturityLevel.NORMING
        : score >= 50
        ? MaturityLevel.STORMING
        : MaturityLevel.FORMING

    return {
      observations,
      assessment: {
        assessmentType: AssessmentType.DOCUMENT_ANALYSIS,
        category: "Planning Quality",
        currentScore: Math.max(0, Math.min(100, score)),
        maturityLevel,
        strengths: ["Team conducts regular planning sessions"],
        weaknesses: observations.map((o) => o.title),
        recommendations: this.generatePlanningRecommendations(observations),
        dataAnalyzed: {
          documentCount: planningDocs.length,
        },
      },
    }
  }

  /**
   * Analyze conversation patterns for coaching opportunities
   */
  private static analyzeConversationPatterns(conversations: any[]): {
    observations: ObservationData[]
  } {
    const observations: ObservationData[] = []

    // Check for repeated questions (indicates gaps in knowledge retention)
    const questionMap = new Map<string, number>()
    conversations.forEach((conv) => {
      if (conv.messages) {
        conv.messages.forEach((msg: any) => {
          if (msg.role === "user") {
            const normalized = msg.content.toLowerCase().trim()
            questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1)
          }
        })
      }
    })

    const repeatedQuestions = Array.from(questionMap.entries()).filter(
      ([_, count]) => count >= 3
    )

    if (repeatedQuestions.length > 0) {
      observations.push({
        category: ObservationCategory.CONTINUOUS_IMPROVEMENT,
        severity: SeverityLevel.MEDIUM,
        title: "Some topics are being revisited frequently",
        description: `You've asked similar questions about certain topics multiple times. This might indicate areas where you need deeper understanding or where your team needs more practice. Consider creating reference materials or conducting focused learning sessions on these topics.`,
        dataSource: "Conversation Analysis",
        dataEvidence: {
          repeatedTopics: repeatedQuestions.length,
        },
        affectedAreas: ["Knowledge Retention", "Team Training"],
      })
    }

    return { observations }
  }

  /**
   * Generate interventions based on observations
   */
  private static generateInterventions(
    observations: ObservationData[]
  ): InterventionData[] {
    const interventions: InterventionData[] = []

    // Group observations by category
    const categoryMap = new Map<ObservationCategory, ObservationData[]>()
    observations.forEach((obs) => {
      if (!categoryMap.has(obs.category)) {
        categoryMap.set(obs.category, [])
      }
      categoryMap.get(obs.category)?.push(obs)
    })

    // Generate interventions for each category
    categoryMap.forEach((obs, category) => {
      switch (category) {
        case ObservationCategory.STORY_ACCEPTANCE_CRITERIA:
          interventions.push({
            observationIds: obs.map((o) => o.title),
            title: "Implement Acceptance Criteria Workshop",
            description:
              "Conduct a team workshop on writing effective acceptance criteria using the INVEST principles. Focus on making criteria testable, specific, and value-driven.",
            actionItems: [
              {
                title: "Schedule 2-hour AC Workshop",
                description:
                  "Book time with the team to practice writing acceptance criteria",
                resources: [
                  "INVEST principles guide",
                  "AC templates and examples",
                ],
              },
              {
                title: "Create AC checklist",
                description:
                  "Develop a simple checklist for the team to use when refining stories",
                resources: ["AC checklist template"],
              },
              {
                title: "Implement AC review in refinement",
                description:
                  "Add AC quality check as a mandatory step in backlog refinement",
              },
            ],
            priority: PriorityLevel.HIGH,
            estimatedImpact: ImpactLevel.HIGH,
            estimatedEffort: EffortLevel.MEDIUM,
          })
          break

        case ObservationCategory.RETROSPECTIVE_QUALITY:
          interventions.push({
            observationIds: obs.map((o) => o.title),
            title: "Revitalize Retrospective Practice",
            description:
              "Transform retrospectives from status meetings into powerful improvement engines. Focus on generating actionable insights and tracking progress on action items.",
            actionItems: [
              {
                title: "Try a new retro format",
                description:
                  "Use formats like Sailboat, 4Ls, or Start-Stop-Continue to generate fresh insights",
                resources: ["Retrospective format library", "Facilitation guides"],
              },
              {
                title: "Establish action item tracking",
                description:
                  "Create a visible board to track action items and review progress in each retro",
              },
              {
                title: "Rotate facilitation",
                description:
                  "Let different team members facilitate to bring new perspectives",
              },
            ],
            priority: PriorityLevel.HIGH,
            estimatedImpact: ImpactLevel.TRANSFORMATIVE,
            estimatedEffort: EffortLevel.LOW,
          })
          break

        case ObservationCategory.TEAM_VELOCITY:
          interventions.push({
            observationIds: obs.map((o) => o.title),
            title: "Stabilize Velocity Through Better Planning",
            description:
              "Improve velocity predictability by focusing on better estimation, capacity planning, and removing impediments faster.",
            actionItems: [
              {
                title: "Review estimation practices",
                description:
                  "Ensure the team understands story points and estimates consistently",
                resources: ["Estimation workshop materials"],
              },
              {
                title: "Track capacity vs. commitment",
                description:
                  "Start tracking actual capacity vs. planned capacity to improve planning",
              },
              {
                title: "Daily blocker triage",
                description:
                  "Implement a quick daily check to identify and resolve blockers immediately",
              },
            ],
            priority: PriorityLevel.MEDIUM,
            estimatedImpact: ImpactLevel.HIGH,
            estimatedEffort: EffortLevel.MEDIUM,
          })
          break

        case ObservationCategory.RISK_MANAGEMENT:
          interventions.push({
            observationIds: obs.map((o) => o.title),
            title: "Build Proactive Risk Management Practice",
            description:
              "Integrate risk identification and mitigation into planning and daily operations.",
            actionItems: [
              {
                title: "Add risk discussion to planning",
                description:
                  "Dedicate 15 minutes in planning to identify risks and dependencies",
              },
              {
                title: "Create risk register",
                description:
                  "Maintain a simple risk register and review it regularly",
                resources: ["Risk register template"],
              },
              {
                title: "Assign risk owners",
                description: "Make someone responsible for monitoring each identified risk",
              },
            ],
            priority: PriorityLevel.MEDIUM,
            estimatedImpact: ImpactLevel.MEDIUM,
            estimatedEffort: EffortLevel.LOW,
          })
          break
      }
    })

    return interventions
  }

  /**
   * Calculate overall maturity level
   */
  private static calculateMaturityLevel(
    assessments: AssessmentData[]
  ): MaturityLevel {
    if (assessments.length === 0) return MaturityLevel.FORMING

    const avgScore =
      assessments.reduce((sum, a) => sum + a.currentScore, 0) /
      assessments.length

    if (avgScore >= 90) return MaturityLevel.TRANSFORMING
    if (avgScore >= 80) return MaturityLevel.PERFORMING
    if (avgScore >= 65) return MaturityLevel.NORMING
    if (avgScore >= 50) return MaturityLevel.STORMING
    return MaturityLevel.FORMING
  }

  /**
   * Identify focus areas based on observations
   */
  private static identifyFocusAreas(
    observations: ObservationData[]
  ): string[] {
    const categoryCount = new Map<string, number>()
    observations.forEach((obs) => {
      const category = obs.category
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })

    // Sort by frequency and severity
    const sorted = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => this.categoryToFocusArea(cat))

    return sorted
  }

  private static categoryToFocusArea(category: string): string {
    const mapping: Record<string, string> = {
      STORY_ACCEPTANCE_CRITERIA: "User Story Quality",
      RETROSPECTIVE_QUALITY: "Retrospective Effectiveness",
      SPRINT_PLANNING: "Sprint Planning & Commitment",
      TEAM_VELOCITY: "Velocity & Predictability",
      RISK_MANAGEMENT: "Risk & Dependency Management",
      CONTINUOUS_IMPROVEMENT: "Continuous Improvement",
      TEAM_COLLABORATION: "Team Collaboration",
    }
    return mapping[category] || category
  }

  // Helper methods for generating strengths and recommendations
  private static generateStoryStrengths(
    stories: any[],
    observations: ObservationData[]
  ): string[] {
    const strengths = []
    if (stories.length > 0) {
      strengths.push(`Team is writing ${stories.length} user stories`)
    }
    if (observations.length === 0) {
      strengths.push("Story quality is good overall")
    }
    const withPoints = stories.filter((s) => s.storyPoints && s.storyPoints > 0)
    if (withPoints.length > stories.length * 0.8) {
      strengths.push("Consistent story point estimation")
    }
    return strengths.length > 0 ? strengths : ["Team is practicing user story writing"]
  }

  private static generateStoryRecommendations(
    observations: ObservationData[]
  ): string[] {
    const recommendations = []
    if (observations.some((o) => o.category === ObservationCategory.STORY_ACCEPTANCE_CRITERIA)) {
      recommendations.push(
        "Conduct a workshop on writing effective acceptance criteria using INVEST principles"
      )
      recommendations.push(
        "Create a story template that includes required sections for AC"
      )
    }
    if (observations.some((o) => o.title.includes("shallow"))) {
      recommendations.push(
        "Implement a 'Definition of Ready' checklist for stories"
      )
    }
    return recommendations
  }

  private static generateSprintStrengths(
    sprintMap: Map<string, any[]>,
    observations: ObservationData[]
  ): string[] {
    const strengths = []
    if (sprintMap.size > 0) {
      strengths.push(`Team has completed ${sprintMap.size} sprints`)
    }
    if (observations.length === 0) {
      strengths.push("Sprint health metrics are good")
    }
    return strengths.length > 0 ? strengths : ["Team is running sprints regularly"]
  }

  private static generateSprintRecommendations(
    observations: ObservationData[]
  ): string[] {
    const recommendations = []
    if (observations.some((o) => o.title.includes("completion rate"))) {
      recommendations.push("Review sprint commitments and team capacity")
      recommendations.push(
        "Identify and address recurring blockers in daily standups"
      )
    }
    if (observations.some((o) => o.title.includes("carry-over"))) {
      recommendations.push("Break down large stories into smaller, manageable pieces")
    }
    return recommendations
  }

  private static generateVelocityStrengths(
    sprintVelocity: Map<string, number>,
    observations: ObservationData[]
  ): string[] {
    const strengths = []
    if (sprintVelocity.size >= 3) {
      strengths.push("Team has sufficient history for velocity analysis")
    }
    if (observations.length === 0) {
      strengths.push("Velocity is stable and predictable")
    }
    return strengths.length > 0 ? strengths : ["Team is tracking velocity"]
  }

  private static generateVelocityRecommendations(
    observations: ObservationData[]
  ): string[] {
    const recommendations = []
    if (observations.some((o) => o.title.includes("variable"))) {
      recommendations.push(
        "Focus on consistent team composition and minimize interruptions"
      )
      recommendations.push("Improve estimation accuracy through regular calibration")
    }
    return recommendations
  }

  private static generateRetroStrengths(
    retroDocs: any[],
    observations: ObservationData[]
  ): string[] {
    const strengths = []
    if (retroDocs.length > 0) {
      strengths.push("Team conducts regular retrospectives")
    }
    if (observations.length === 0) {
      strengths.push("Retrospective quality is good")
    }
    return strengths.length > 0 ? strengths : ["Team practices retrospectives"]
  }

  private static generateRetroRecommendations(
    observations: ObservationData[]
  ): string[] {
    const recommendations = []
    if (observations.some((o) => o.title.includes("action items"))) {
      recommendations.push(
        "End each retro with clear, assigned action items with owners and due dates"
      )
      recommendations.push("Review action item progress at the start of each retro")
    }
    if (observations.some((o) => o.title.includes("shallow"))) {
      recommendations.push("Try new facilitation techniques to deepen discussions")
      recommendations.push("Use the '5 Whys' technique to get to root causes")
    }
    return recommendations
  }

  private static generatePlanningRecommendations(
    observations: ObservationData[]
  ): string[] {
    const recommendations = []
    if (observations.some((o) => o.title.includes("risk"))) {
      recommendations.push(
        "Add a dedicated risk identification step to planning meetings"
      )
      recommendations.push(
        "Create a simple risk register to track and mitigate risks"
      )
    }
    return recommendations
  }
}
