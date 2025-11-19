
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  MessageSquare,
  Activity,
  Target,
  AlertTriangle,
  Zap,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type AnalyticsType = 
  | 'USER_ENGAGEMENT'
  | 'TEAM_PERFORMANCE'
  | 'DOCUMENT_USAGE'
  | 'QUERY_PATTERNS'
  | 'RISK_TRENDS'
  | 'VELOCITY_TRENDS'

interface AnalyticsSnapshot {
  id: string
  snapshotType: AnalyticsType
  period: string
  metrics: any
  trends: any[]
  predictions: any[]
  generatedAt: string
}

export function AnalyticsDashboard() {
  const [selectedType, setSelectedType] = useState<AnalyticsType>('USER_ENGAGEMENT')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [selectedType, timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      if (timeRange === '7d') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (timeRange === '30d') {
        startDate.setDate(startDate.getDate() - 30)
      } else {
        startDate.setDate(startDate.getDate() - 90)
      }

      const response = await fetch('/api/analytics/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSnapshot(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChartData = () => {
    if (!snapshot?.trends || snapshot.trends.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    return {
      labels: snapshot.trends.map((t: any) => t.period),
      datasets: [
        {
          label: 'Value',
          data: snapshot.trends.map((t: any) => t.value),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: 'up' | 'down' | 'stable'
  ) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                {trend === 'stable' && <Activity className="h-4 w-4 text-gray-500 mr-1" />}
                <span className="text-sm text-muted-foreground capitalize">{trend}</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderUserEngagement = () => {
    const metrics = snapshot?.metrics
    if (!metrics) return null

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {renderMetricCard(
            'Total Activities',
            metrics.totalActivities || 0,
            <Activity className="h-6 w-6 text-primary" />
          )}
          {renderMetricCard(
            'Active Users',
            metrics.activeUsers || 0,
            <Users className="h-6 w-6 text-primary" />
          )}
          {metrics.userEngagement && renderMetricCard(
            'Daily Active Users',
            metrics.userEngagement.dailyActiveUsers || 0,
            <Calendar className="h-6 w-6 text-primary" />
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>Activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTeamPerformance = () => {
    const metrics = snapshot?.metrics
    if (!metrics?.teamPerformance) return null

    const perf = metrics.teamPerformance

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {renderMetricCard(
            'Average Velocity',
            Math.round(perf.averageVelocity || 0),
            <Zap className="h-6 w-6 text-primary" />,
            snapshot?.predictions?.[0]?.trend
          )}
          {renderMetricCard(
            'Completion Rate',
            `${Math.round((perf.completionRate || 0) * 100)}%`,
            <Target className="h-6 w-6 text-primary" />
          )}
          {renderMetricCard(
            'Risk Score',
            Math.round(perf.riskScore || 0),
            <AlertTriangle className="h-6 w-6 text-primary" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Team metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {snapshot?.predictions && snapshot.predictions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>AI-powered predictions for next sprint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {snapshot.predictions.map((pred: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{pred.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        Predicted: {Math.round(pred.prediction)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pred.trend === 'up' ? 'default' : pred.trend === 'down' ? 'destructive' : 'secondary'}>
                        {pred.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {pred.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                        {pred.trend}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(pred.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderDocumentUsage = () => {
    const metrics = snapshot?.metrics
    if (!metrics?.documentUsage) return null

    const docUsage = metrics.documentUsage

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {renderMetricCard(
            'Documents Uploaded',
            docUsage.totalUploads || 0,
            <FileText className="h-6 w-6 text-primary" />
          )}
          {renderMetricCard(
            'Total Views',
            docUsage.totalViews || 0,
            <Activity className="h-6 w-6 text-primary" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Trends</CardTitle>
            <CardDescription>Document uploads over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={getChartData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {docUsage.mostViewedDocs && docUsage.mostViewedDocs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Documents</CardTitle>
              <CardDescription>Top 10 documents by view count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {docUsage.mostViewedDocs.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <Badge variant="secondary">{doc.views} views</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderQueryPatterns = () => {
    const metrics = snapshot?.metrics
    if (!metrics) return null

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {renderMetricCard(
            'Total Queries',
            metrics.queriesExecuted || 0,
            <MessageSquare className="h-6 w-6 text-primary" />
          )}
          {renderMetricCard(
            'Avg Response Time',
            `${Math.round(metrics.averageResponseTime || 0)}ms`,
            <Zap className="h-6 w-6 text-primary" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Query Volume</CardTitle>
            <CardDescription>Queries over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {metrics.topQueries && metrics.topQueries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Queries</CardTitle>
              <CardDescription>Most frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.topQueries.map((query: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{query.query}</span>
                    </div>
                    <Badge variant="secondary">{query.count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Advanced insights and performance metrics
          </p>
        </div>
        <Button onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AnalyticsType)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select analytics type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER_ENGAGEMENT">User Engagement</SelectItem>
            <SelectItem value="TEAM_PERFORMANCE">Team Performance</SelectItem>
            <SelectItem value="DOCUMENT_USAGE">Document Usage</SelectItem>
            <SelectItem value="QUERY_PATTERNS">Query Patterns</SelectItem>
            <SelectItem value="RISK_TRENDS">Risk Trends</SelectItem>
            <SelectItem value="VELOCITY_TRENDS">Velocity Trends</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedType === 'USER_ENGAGEMENT' && renderUserEngagement()}
          {selectedType === 'TEAM_PERFORMANCE' && renderTeamPerformance()}
          {selectedType === 'DOCUMENT_USAGE' && renderDocumentUsage()}
          {selectedType === 'QUERY_PATTERNS' && renderQueryPatterns()}
          {(selectedType === 'RISK_TRENDS' || selectedType === 'VELOCITY_TRENDS') && renderTeamPerformance()}
        </>
      )}
    </div>
  )
}
