
import { prisma } from './db'
import { RiskLevel, TrendDirection } from '@prisma/client'

export interface RiskFactors {
  confidenceFactor: number // 0-1, contribution to risk
  velocityFactor: number
  throughputFactor: number
  objectiveFactor: number
  description: string[]
}

export interface RiskAnalysisResult {
  overallRiskScore: number // 0-100
  riskLevel: RiskLevel
  confidenceScore?: number
  velocityScore?: number
  throughputScore?: number
  objectiveHealthScore?: number
  factors: RiskFactors
  recommendations: string[]
}

/**
 * Analyzes team risk based on confidence votes, metrics, and objectives
 */
export async function analyzeTeamRisk(
  teamId: string,
  sprint: string
): Promise<RiskAnalysisResult> {
  // Fetch all relevant data
  const [confidenceVotes, metrics, objectives] = await Promise.all([
    prisma.teamConfidenceVote.findMany({
      where: { teamId, sprint },
      orderBy: { votedAt: 'desc' }
    }),
    prisma.teamMetric.findMany({
      where: { teamId, sprint },
      orderBy: { recordedAt: 'desc' }
    }),
    prisma.teamObjective.findMany({
      where: { teamId, sprint },
      orderBy: { createdAt: 'desc' }
    })
  ])

  // Calculate confidence score (lower confidence = higher risk)
  const confidenceScore = calculateConfidenceScore(confidenceVotes)
  const confidenceFactor = 1 - (confidenceScore / 5) // Normalize to 0-1

  // Calculate velocity trends
  const velocityScore = calculateVelocityScore(metrics)
  const velocityFactor = calculateVelocityRiskFactor(metrics)

  // Calculate throughput
  const throughputScore = calculateThroughputScore(metrics)
  const throughputFactor = calculateThroughputRiskFactor(metrics)

  // Calculate objective health
  const objectiveHealthScore = calculateObjectiveHealth(objectives)
  const objectiveFactor = 1 - (objectiveHealthScore / 100)

  // Weighted risk calculation
  const weights = {
    confidence: 0.35,
    velocity: 0.25,
    throughput: 0.20,
    objectives: 0.20
  }

  const overallRiskScore = Math.round(
    (confidenceFactor * weights.confidence +
      velocityFactor * weights.velocity +
      throughputFactor * weights.throughput +
      objectiveFactor * weights.objectives) * 100
  )

  // Determine risk level
  const riskLevel = getRiskLevel(overallRiskScore)

  // Generate recommendations
  const recommendations = generateRecommendations({
    confidenceFactor,
    velocityFactor,
    throughputFactor,
    objectiveFactor,
    overallRiskScore,
    riskLevel
  })

  // Build detailed factors description
  const factorDescriptions: string[] = []
  if (confidenceFactor > 0.3) {
    factorDescriptions.push(`Low team confidence (avg: ${confidenceScore.toFixed(1)}/5)`)
  }
  if (velocityFactor > 0.3) {
    factorDescriptions.push(`Velocity concerns detected`)
  }
  if (throughputFactor > 0.3) {
    factorDescriptions.push(`Throughput below expectations`)
  }
  if (objectiveFactor > 0.3) {
    factorDescriptions.push(`Objective health needs attention (${objectiveHealthScore.toFixed(0)}%)`)
  }

  return {
    overallRiskScore,
    riskLevel,
    confidenceScore,
    velocityScore,
    throughputScore,
    objectiveHealthScore,
    factors: {
      confidenceFactor,
      velocityFactor,
      throughputFactor,
      objectiveFactor,
      description: factorDescriptions
    },
    recommendations
  }
}

function calculateConfidenceScore(votes: any[]): number {
  if (votes.length === 0) return 3 // Default neutral score
  const sum = votes.reduce((acc, vote) => acc + vote.confidenceLevel, 0)
  return sum / votes.length
}

function calculateVelocityScore(metrics: any[]): number {
  const velocityMetrics = metrics.filter(m => 
    m.metricType === 'VELOCITY' || m.metricType === 'STORY_POINTS_COMPLETED'
  )
  
  if (velocityMetrics.length === 0) return 50 // Default score

  // Calculate average velocity
  const sum = velocityMetrics.reduce((acc, m) => acc + m.value, 0)
  return sum / velocityMetrics.length
}

function calculateVelocityRiskFactor(metrics: any[]): number {
  const velocityMetrics = metrics
    .filter(m => m.metricType === 'VELOCITY')
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
    .slice(0, 3) // Last 3 data points

  if (velocityMetrics.length < 2) return 0.3 // Default moderate risk

  // Check for downward trend
  let trendDown = 0
  for (let i = 0; i < velocityMetrics.length - 1; i++) {
    if (velocityMetrics[i].value < velocityMetrics[i + 1].value) {
      trendDown++
    }
  }

  const trendFactor = trendDown / (velocityMetrics.length - 1)
  
  // Check against target
  const recentMetric = velocityMetrics[0]
  const targetFactor = recentMetric.target 
    ? Math.max(0, 1 - (recentMetric.value / recentMetric.target))
    : 0

  return (trendFactor * 0.6 + targetFactor * 0.4)
}

function calculateThroughputScore(metrics: any[]): number {
  const throughputMetrics = metrics.filter(m => m.metricType === 'THROUGHPUT')
  
  if (throughputMetrics.length === 0) return 50

  const sum = throughputMetrics.reduce((acc, m) => acc + m.value, 0)
  return sum / throughputMetrics.length
}

function calculateThroughputRiskFactor(metrics: any[]): number {
  const throughputMetrics = metrics
    .filter(m => m.metricType === 'THROUGHPUT' || m.metricType === 'COMPLETION_RATE')
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
    .slice(0, 3)

  if (throughputMetrics.length === 0) return 0.3

  // Calculate average completion rate
  const avgValue = throughputMetrics.reduce((acc, m) => acc + m.value, 0) / throughputMetrics.length

  // Lower throughput = higher risk
  if (avgValue < 50) return 0.8
  if (avgValue < 70) return 0.5
  if (avgValue < 85) return 0.3
  return 0.1
}

function calculateObjectiveHealth(objectives: any[]): number {
  if (objectives.length === 0) return 100 // No objectives = no risk (optimistic)

  const statusScores: Record<string, number> = {
    COMPLETED: 100,
    IN_PROGRESS: 70,
    PLANNED: 60,
    AT_RISK: 40,
    BLOCKED: 20,
    ABANDONED: 0
  }

  const sum = objectives.reduce((acc, obj) => {
    return acc + (statusScores[obj.status] || 50)
  }, 0)

  return sum / objectives.length
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MODERATE'
  return 'LOW'
}

function generateRecommendations(data: {
  confidenceFactor: number
  velocityFactor: number
  throughputFactor: number
  objectiveFactor: number
  overallRiskScore: number
  riskLevel: RiskLevel
}): string[] {
  const recommendations: string[] = []

  // Confidence-based recommendations
  if (data.confidenceFactor > 0.5) {
    recommendations.push(
      'Schedule a team confidence-building session to address concerns',
      'Review sprint commitments and consider reducing scope'
    )
  } else if (data.confidenceFactor > 0.3) {
    recommendations.push(
      'Monitor team confidence closely through daily standups'
    )
  }

  // Velocity-based recommendations
  if (data.velocityFactor > 0.5) {
    recommendations.push(
      'Investigate velocity drop: Check for impediments, team changes, or technical debt',
      'Consider team capacity planning workshop'
    )
  } else if (data.velocityFactor > 0.3) {
    recommendations.push(
      'Track velocity trends and identify early warning signs'
    )
  }

  // Throughput-based recommendations
  if (data.throughputFactor > 0.5) {
    recommendations.push(
      'Analyze cycle time and identify bottlenecks in the workflow',
      'Review work in progress (WIP) limits'
    )
  }

  // Objective-based recommendations
  if (data.objectiveFactor > 0.5) {
    recommendations.push(
      'Conduct immediate objective health review with stakeholders',
      'Consider re-prioritizing or descoping at-risk objectives'
    )
  } else if (data.objectiveFactor > 0.3) {
    recommendations.push(
      'Increase frequency of objective status updates'
    )
  }

  // Overall risk recommendations
  if (data.riskLevel === 'CRITICAL') {
    recommendations.push(
      '🚨 URGENT: Escalate to leadership and consider intervention',
      'Hold emergency retrospective to address critical issues'
    )
  } else if (data.riskLevel === 'HIGH') {
    recommendations.push(
      'Increase oversight and daily check-ins with the team',
      'Engage Agile Coach for support'
    )
  }

  // Default recommendation if no specific issues
  if (recommendations.length === 0) {
    recommendations.push(
      'Team is performing well - maintain current practices',
      'Continue monitoring key metrics for early detection of issues'
    )
  }

  return recommendations
}

/**
 * Calculate and persist risk score for a team
 */
export async function calculateAndSaveRiskScore(
  teamId: string,
  sprint: string
): Promise<void> {
  const analysis = await analyzeTeamRisk(teamId, sprint)

  await prisma.teamRiskScore.create({
    data: {
      teamId,
      sprint,
      overallRiskScore: analysis.overallRiskScore,
      riskLevel: analysis.riskLevel,
      confidenceScore: analysis.confidenceScore,
      velocityScore: analysis.velocityScore,
      throughputScore: analysis.throughputScore,
      objectiveHealthScore: analysis.objectiveHealthScore,
      factors: analysis.factors as any,
      recommendations: analysis.recommendations
    }
  })
}

/**
 * Get color coding for risk level
 */
export function getRiskColor(riskLevel: RiskLevel): {
  bg: string
  text: string
  border: string
} {
  switch (riskLevel) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-100 dark:bg-red-950',
        text: 'text-red-900 dark:text-red-100',
        border: 'border-red-500'
      }
    case 'HIGH':
      return {
        bg: 'bg-orange-100 dark:bg-orange-950',
        text: 'text-orange-900 dark:text-orange-100',
        border: 'border-orange-500'
      }
    case 'MODERATE':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-950',
        text: 'text-yellow-900 dark:text-yellow-100',
        border: 'border-yellow-500'
      }
    case 'LOW':
      return {
        bg: 'bg-green-100 dark:bg-green-950',
        text: 'text-green-900 dark:text-green-100',
        border: 'border-green-500'
      }
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-900 dark:text-gray-100',
        border: 'border-gray-500'
      }
  }
}
