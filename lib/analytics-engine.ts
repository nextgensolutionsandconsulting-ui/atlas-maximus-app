
import { prisma } from '@/lib/db'
import { AnalyticsType, ActivityType, QueryType } from '@prisma/client'

interface AnalyticsMetrics {
  totalActivities?: number
  activeUsers?: number
  documentsProcessed?: number
  queriesExecuted?: number
  averageResponseTime?: number
  teamPerformance?: {
    averageVelocity: number
    completionRate: number
    riskScore: number
  }
  topQueries?: Array<{ query: string; count: number }>
  userEngagement?: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
  }
  documentUsage?: {
    totalUploads: number
    totalViews: number
    mostViewedDocs: Array<{ name: string; views: number }>
  }
}

interface TrendData {
  period: string
  value: number
  change?: number
}

interface PredictiveInsight {
  metric: string
  prediction: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

export class AnalyticsEngine {
  /**
   * Generate comprehensive analytics snapshot
   */
  static async generateSnapshot(
    type: AnalyticsType,
    startDate: Date,
    endDate: Date,
    userId?: string,
    teamId?: string
  ) {
    const period = this.getPeriodLabel(startDate, endDate)
    
    let metrics: AnalyticsMetrics = {}
    let trends: TrendData[] = []
    let predictions: PredictiveInsight[] = []

    switch (type) {
      case 'USER_ENGAGEMENT':
        metrics = await this.getUserEngagementMetrics(userId, startDate, endDate)
        trends = await this.getUserEngagementTrends(userId, startDate, endDate)
        break
      
      case 'TEAM_PERFORMANCE':
        metrics = await this.getTeamPerformanceMetrics(teamId, startDate, endDate)
        trends = await this.getTeamPerformanceTrends(teamId, startDate, endDate)
        predictions = await this.predictTeamPerformance(teamId)
        break
      
      case 'DOCUMENT_USAGE':
        metrics = await this.getDocumentUsageMetrics(userId, startDate, endDate)
        trends = await this.getDocumentUsageTrends(startDate, endDate)
        break
      
      case 'QUERY_PATTERNS':
        metrics = await this.getQueryPatternMetrics(userId, startDate, endDate)
        trends = await this.getQueryPatternTrends(startDate, endDate)
        break
      
      case 'RISK_TRENDS':
        metrics = await this.getRiskTrendMetrics(teamId, startDate, endDate)
        trends = await this.getRiskTrends(teamId, startDate, endDate)
        predictions = await this.predictRiskTrends(teamId)
        break
      
      case 'VELOCITY_TRENDS':
        metrics = await this.getVelocityMetrics(teamId, startDate, endDate)
        trends = await this.getVelocityTrends(teamId, startDate, endDate)
        predictions = await this.predictVelocity(teamId)
        break
      
      default:
        metrics = await this.getSystemWideMetrics(startDate, endDate)
    }

    // Store the snapshot
    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        userId,
        teamId,
        snapshotType: type,
        period,
        startDate,
        endDate,
        metrics: metrics as any,
        trends: trends as any,
        predictions: predictions as any,
      },
    })

    return snapshot
  }

  /**
   * Track user activity
   */
  static async trackActivity(
    userId: string,
    activityType: ActivityType,
    entityType: string,
    entityId?: string,
    metadata?: any,
    duration?: number
  ) {
    return await prisma.userActivity.create({
      data: {
        userId,
        activityType,
        entityType,
        entityId,
        metadata,
        duration,
      },
    })
  }

  /**
   * Track query analytics
   */
  static async trackQuery(
    userId: string,
    query: string,
    queryType: QueryType,
    responseTime?: number,
    resultCount?: number,
    documentsReferenced?: string[]
  ) {
    return await prisma.queryAnalytics.create({
      data: {
        userId,
        query,
        queryType,
        responseTime,
        resultCount,
        documentsReferenced: documentsReferenced || [],
      },
    })
  }

  /**
   * Get user engagement metrics
   */
  private static async getUserEngagementMetrics(
    userId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const where = userId
      ? { userId, timestamp: { gte: startDate, lte: endDate } }
      : { timestamp: { gte: startDate, lte: endDate } }

    const activities = await prisma.userActivity.findMany({ where })
    
    const uniqueUsers = new Set(activities.map(a => a.userId))
    
    return {
      totalActivities: activities.length,
      activeUsers: uniqueUsers.size,
      userEngagement: {
        dailyActiveUsers: await this.getActiveUsers(startDate, endDate, 1),
        weeklyActiveUsers: await this.getActiveUsers(startDate, endDate, 7),
        monthlyActiveUsers: await this.getActiveUsers(startDate, endDate, 30),
      },
    }
  }

  /**
   * Get team performance metrics
   */
  private static async getTeamPerformanceMetrics(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    if (!teamId) return {}

    const metrics = await prisma.teamMetric.findMany({
      where: {
        teamId,
        recordedAt: { gte: startDate, lte: endDate },
      },
    })

    const velocityMetrics = metrics.filter(m => m.metricType === 'VELOCITY')
    const completionMetrics = metrics.filter(m => m.metricType === 'COMPLETION_RATE')

    const averageVelocity = velocityMetrics.length
      ? velocityMetrics.reduce((sum, m) => sum + m.value, 0) / velocityMetrics.length
      : 0

    const completionRate = completionMetrics.length
      ? completionMetrics.reduce((sum, m) => sum + m.value, 0) / completionMetrics.length
      : 0

    const riskScores = await prisma.teamRiskScore.findMany({
      where: {
        teamId,
        calculatedAt: { gte: startDate, lte: endDate },
      },
    })

    const averageRiskScore = riskScores.length
      ? riskScores.reduce((sum, r) => sum + r.overallRiskScore, 0) / riskScores.length
      : 0

    return {
      teamPerformance: {
        averageVelocity,
        completionRate,
        riskScore: averageRiskScore,
      },
    }
  }

  /**
   * Get document usage metrics
   */
  private static async getDocumentUsageMetrics(
    userId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const uploads = await prisma.document.count({
      where: {
        ...(userId && { userId }),
        uploadedAt: { gte: startDate, lte: endDate },
      },
    })

    const views = await prisma.userActivity.count({
      where: {
        ...(userId && { userId }),
        activityType: 'DOCUMENT_VIEW',
        timestamp: { gte: startDate, lte: endDate },
      },
    })

    const mostViewedDocs = await prisma.document.findMany({
      where: {
        ...(userId && { userId }),
        uploadedAt: { lte: endDate },
      },
      orderBy: { accessCount: 'desc' },
      take: 10,
      select: { originalName: true, accessCount: true },
    })

    return {
      documentUsage: {
        totalUploads: uploads,
        totalViews: views,
        mostViewedDocs: mostViewedDocs.map(doc => ({
          name: doc.originalName,
          views: doc.accessCount,
        })),
      },
    }
  }

  /**
   * Get query pattern metrics
   */
  private static async getQueryPatternMetrics(
    userId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const queries = await prisma.queryAnalytics.findMany({
      where: {
        ...(userId && { userId }),
        timestamp: { gte: startDate, lte: endDate },
      },
    })

    const totalQueries = queries.length
    const avgResponseTime = queries.length
      ? queries.reduce((sum, q) => sum + (q.responseTime || 0), 0) / queries.length
      : 0

    // Get top queries
    const queryMap = new Map<string, number>()
    queries.forEach(q => {
      const count = queryMap.get(q.query) || 0
      queryMap.set(q.query, count + 1)
    })

    const topQueries = Array.from(queryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    return {
      queriesExecuted: totalQueries,
      averageResponseTime: avgResponseTime,
      topQueries,
    }
  }

  /**
   * Get risk trend metrics
   */
  private static async getRiskTrendMetrics(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    if (!teamId) return {}

    const riskScores = await prisma.teamRiskScore.findMany({
      where: {
        teamId,
        calculatedAt: { gte: startDate, lte: endDate },
      },
    })

    const avgRisk = riskScores.length
      ? riskScores.reduce((sum, r) => sum + r.overallRiskScore, 0) / riskScores.length
      : 0

    return {
      teamPerformance: {
        averageVelocity: 0,
        completionRate: 0,
        riskScore: avgRisk,
      },
    }
  }

  /**
   * Get velocity metrics
   */
  private static async getVelocityMetrics(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    if (!teamId) return {}

    const velocityMetrics = await prisma.teamMetric.findMany({
      where: {
        teamId,
        metricType: 'VELOCITY',
        recordedAt: { gte: startDate, lte: endDate },
      },
    })

    const avgVelocity = velocityMetrics.length
      ? velocityMetrics.reduce((sum, m) => sum + m.value, 0) / velocityMetrics.length
      : 0

    return {
      teamPerformance: {
        averageVelocity: avgVelocity,
        completionRate: 0,
        riskScore: 0,
      },
    }
  }

  /**
   * Get system-wide metrics
   */
  private static async getSystemWideMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    const [totalActivities, documentsProcessed, queriesExecuted, activeUsers] = await Promise.all([
      prisma.userActivity.count({
        where: { timestamp: { gte: startDate, lte: endDate } },
      }),
      prisma.document.count({
        where: { uploadedAt: { gte: startDate, lte: endDate } },
      }),
      prisma.queryAnalytics.count({
        where: { timestamp: { gte: startDate, lte: endDate } },
      }),
      prisma.userActivity.findMany({
        where: { timestamp: { gte: startDate, lte: endDate } },
        distinct: ['userId'],
      }),
    ])

    return {
      totalActivities,
      documentsProcessed,
      queriesExecuted,
      activeUsers: activeUsers.length,
    }
  }

  /**
   * Helper: Get active users for a time period
   */
  private static async getActiveUsers(
    startDate: Date,
    endDate: Date,
    days: number
  ): Promise<number> {
    const cutoffDate = new Date(endDate)
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const activities = await prisma.userActivity.findMany({
      where: {
        timestamp: { gte: cutoffDate, lte: endDate },
      },
      distinct: ['userId'],
    })

    return activities.length
  }

  /**
   * Get user engagement trends
   */
  private static async getUserEngagementTrends(
    userId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    // Simplified trend calculation - group by day
    const activities = await prisma.userActivity.findMany({
      where: {
        ...(userId && { userId }),
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    })

    const dailyMap = new Map<string, number>()
    activities.forEach(activity => {
      const day = activity.timestamp.toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    })

    return Array.from(dailyMap.entries()).map(([period, value]) => ({
      period,
      value,
    }))
  }

  /**
   * Get team performance trends
   */
  private static async getTeamPerformanceTrends(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    if (!teamId) return []

    const metrics = await prisma.teamMetric.findMany({
      where: {
        teamId,
        metricType: 'VELOCITY',
        recordedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { recordedAt: 'asc' },
    })

    return metrics.map(m => ({
      period: m.sprint,
      value: m.value,
    }))
  }

  /**
   * Get document usage trends
   */
  private static async getDocumentUsageTrends(
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    const documents = await prisma.document.findMany({
      where: {
        uploadedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { uploadedAt: 'asc' },
    })

    const dailyMap = new Map<string, number>()
    documents.forEach(doc => {
      const day = doc.uploadedAt.toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    })

    return Array.from(dailyMap.entries()).map(([period, value]) => ({
      period,
      value,
    }))
  }

  /**
   * Get query pattern trends
   */
  private static async getQueryPatternTrends(
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    const queries = await prisma.queryAnalytics.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    })

    const dailyMap = new Map<string, number>()
    queries.forEach(query => {
      const day = query.timestamp.toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    })

    return Array.from(dailyMap.entries()).map(([period, value]) => ({
      period,
      value,
    }))
  }

  /**
   * Get risk trends
   */
  private static async getRiskTrends(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    if (!teamId) return []

    const riskScores = await prisma.teamRiskScore.findMany({
      where: {
        teamId,
        calculatedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { calculatedAt: 'asc' },
    })

    return riskScores.map(r => ({
      period: r.sprint,
      value: r.overallRiskScore,
    }))
  }

  /**
   * Get velocity trends
   */
  private static async getVelocityTrends(
    teamId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TrendData[]> {
    if (!teamId) return []

    const metrics = await prisma.teamMetric.findMany({
      where: {
        teamId,
        metricType: 'VELOCITY',
        recordedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { recordedAt: 'asc' },
    })

    return metrics.map(m => ({
      period: m.sprint,
      value: m.value,
    }))
  }

  /**
   * Predict team performance
   */
  private static async predictTeamPerformance(
    teamId: string | undefined
  ): Promise<PredictiveInsight[]> {
    if (!teamId) return []

    // Simple trend-based prediction
    const metrics = await prisma.teamMetric.findMany({
      where: { teamId, metricType: 'VELOCITY' },
      orderBy: { recordedAt: 'desc' },
      take: 6,
    })

    if (metrics.length < 3) return []

    const values = metrics.map(m => m.value).reverse()
    const trend = this.calculateTrend(values)
    const prediction = values[values.length - 1] * (1 + trend)

    return [
      {
        metric: 'velocity',
        prediction,
        confidence: 0.75,
        trend: trend > 0.05 ? 'up' : trend < -0.05 ? 'down' : 'stable',
      },
    ]
  }

  /**
   * Predict risk trends
   */
  private static async predictRiskTrends(
    teamId: string | undefined
  ): Promise<PredictiveInsight[]> {
    if (!teamId) return []

    const riskScores = await prisma.teamRiskScore.findMany({
      where: { teamId },
      orderBy: { calculatedAt: 'desc' },
      take: 6,
    })

    if (riskScores.length < 3) return []

    const values = riskScores.map(r => r.overallRiskScore).reverse()
    const trend = this.calculateTrend(values)
    const prediction = values[values.length - 1] * (1 + trend)

    return [
      {
        metric: 'risk',
        prediction,
        confidence: 0.7,
        trend: trend > 0.05 ? 'up' : trend < -0.05 ? 'down' : 'stable',
      },
    ]
  }

  /**
   * Predict velocity
   */
  private static async predictVelocity(
    teamId: string | undefined
  ): Promise<PredictiveInsight[]> {
    return this.predictTeamPerformance(teamId)
  }

  /**
   * Helper: Calculate simple trend
   */
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    let sum = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        sum += (values[i] - values[i - 1]) / values[i - 1]
      }
    }

    return sum / (values.length - 1)
  }

  /**
   * Helper: Get period label
   */
  private static getPeriodLabel(startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    
    if (start === end) return start
    
    const startMonth = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    const endMonth = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    
    if (startMonth === endMonth) return startMonth
    
    return `${startMonth} - ${endMonth}`
  }
}
