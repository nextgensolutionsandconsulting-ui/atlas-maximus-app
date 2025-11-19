
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  Lightbulb,
  Trophy,
  Loader2,
  Play,
  CheckCheck,
  XCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface CoachingPlan {
  id: string
  focusAreas: string[]
  currentMaturityLevel: string
  targetMaturityLevel: string
  observations: Observation[]
  interventions: Intervention[]
  assessments: Assessment[]
  generatedAt: string
  updatedAt: string
}

interface Observation {
  id: string
  category: string
  severity: string
  title: string
  description: string
  dataSource?: string
  dataEvidence?: any
  affectedAreas: string[]
  isResolved: boolean
  createdAt: string
}

interface Intervention {
  id: string
  observationIds: string[]
  title: string
  description: string
  actionItems: ActionItem[]
  priority: string
  estimatedImpact: string
  estimatedEffort: string
  status: string
  notes?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
}

interface ActionItem {
  title: string
  description: string
  resources?: string[]
}

interface Assessment {
  id: string
  assessmentType: string
  category: string
  currentScore: number
  previousScore?: number
  maturityLevel: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  createdAt: string
}

export function CoachingCompanion() {
  const { toast } = useToast()
  const [coachingPlan, setCoachingPlan] = useState<CoachingPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [showInterventionDialog, setShowInterventionDialog] = useState(false)
  const [interventionNotes, setInterventionNotes] = useState("")

  useEffect(() => {
    fetchCoachingPlan()
  }, [])

  const fetchCoachingPlan = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/coaching/plan")
      const data = await response.json()

      if (data.exists) {
        setCoachingPlan(data.coachingPlan)
      }
    } catch (error) {
      console.error("Error fetching coaching plan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAnalysis = async () => {
    try {
      setIsAnalyzing(true)
      toast({
        title: "Analyzing your team data...",
        description: "This may take a moment.",
      })

      const response = await fetch("/api/coaching/analyze", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()

      toast({
        title: "Analysis complete!",
        description: `Found ${data.summary.observationsCount} observations and ${data.summary.interventionsCount} recommended interventions.`,
      })

      setCoachingPlan(data.coachingPlan)
    } catch (error) {
      console.error("Error running analysis:", error)
      toast({
        title: "Analysis failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateInterventionStatus = async (
    interventionId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await fetch("/api/coaching/intervention", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId, status, notes }),
      })

      if (!response.ok) {
        throw new Error("Update failed")
      }

      toast({
        title: "Status updated",
        description: "Intervention status has been updated successfully.",
      })

      // Refresh plan
      await fetchCoachingPlan()
      setShowInterventionDialog(false)
      setSelectedIntervention(null)
      setInterventionNotes("")
    } catch (error) {
      console.error("Error updating intervention:", error)
      toast({
        title: "Update failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const getMaturityColor = (level: string) => {
    switch (level) {
      case "FORMING":
        return "text-red-500"
      case "STORMING":
        return "text-orange-500"
      case "NORMING":
        return "text-yellow-500"
      case "PERFORMING":
        return "text-green-500"
      case "TRANSFORMING":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  const getMaturityProgress = (level: string) => {
    const levels = ["FORMING", "STORMING", "NORMING", "PERFORMING", "TRANSFORMING"]
    const index = levels.indexOf(level)
    return ((index + 1) / levels.length) * 100
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      LOW: "outline",
      MEDIUM: "secondary",
      HIGH: "destructive",
      CRITICAL: "destructive",
    }
    return (
      <Badge variant={variants[severity] || "default"}>
        {severity}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      LOW: "outline",
      MEDIUM: "secondary",
      HIGH: "destructive",
      URGENT: "destructive",
    }
    return (
      <Badge variant={variants[priority] || "default"}>
        {priority}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUGGESTED":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case "IN_PROGRESS":
        return <Play className="h-5 w-5 text-blue-500" />
      case "COMPLETED":
        return <CheckCheck className="h-5 w-5 text-green-500" />
      case "DEFERRED":
        return <Clock className="h-5 w-5 text-gray-500" />
      case "NOT_APPLICABLE":
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-purple-100 text-purple-800",
      TRANSFORMATIVE: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[impact] || ""}`}>
        {impact}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!coachingPlan) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Your AI Coaching Companion</CardTitle>
          <CardDescription className="text-base">
            Get personalized coaching insights and maturity-building recommendations based on
            your team's behavior and uploaded data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Analyze Your Team Data</p>
                <p className="text-sm text-muted-foreground">
                  We'll analyze your Jira issues, documents, and conversation patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Get Actionable Insights</p>
                <p className="text-sm text-muted-foreground">
                  Discover patterns, anti-patterns, and areas for improvement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Build Maturity</p>
                <p className="text-sm text-muted-foreground">
                  Follow coaching plans with specific actions to elevate your team
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Coaching Analysis
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Analysis is completely private and based on your data only
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with maturity level */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-purple-600" />
                Your Team Maturity Journey
              </CardTitle>
              <CardDescription>
                Track your progress from{" "}
                <span className={`font-semibold ${getMaturityColor(coachingPlan.currentMaturityLevel)}`}>
                  {coachingPlan.currentMaturityLevel}
                </span>
                {" "}to{" "}
                <span className="font-semibold text-green-600">
                  {coachingPlan.targetMaturityLevel}
                </span>
              </CardDescription>
            </div>
            <Button onClick={runAnalysis} disabled={isAnalyzing} variant="outline">
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Maturity Progress</span>
              <span className={`font-semibold ${getMaturityColor(coachingPlan.currentMaturityLevel)}`}>
                {coachingPlan.currentMaturityLevel}
              </span>
            </div>
            <Progress value={getMaturityProgress(coachingPlan.currentMaturityLevel)} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>FORMING</span>
              <span>STORMING</span>
              <span>NORMING</span>
              <span>PERFORMING</span>
              <span>TRANSFORMING</span>
            </div>
          </div>

          {coachingPlan.focusAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Focus Areas:</p>
              <div className="flex flex-wrap gap-2">
                {coachingPlan.focusAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    <Target className="mr-1 h-3 w-3" />
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="observations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="observations" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Observations
            {coachingPlan.observations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {coachingPlan.observations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Action Plan
            {coachingPlan.interventions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {coachingPlan.interventions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Assessments
          </TabsTrigger>
        </TabsList>

        {/* Observations Tab */}
        <TabsContent value="observations" className="space-y-4">
          {coachingPlan.observations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Looking great!</p>
                <p className="text-muted-foreground">No critical observations at this time.</p>
              </CardContent>
            </Card>
          ) : (
            coachingPlan.observations.map((observation) => (
              <Card key={observation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(observation.severity)}
                        <Badge variant="outline">{observation.category.replace(/_/g, " ")}</Badge>
                      </div>
                      <CardTitle className="text-lg">{observation.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {observation.dataSource && (
                          <span className="text-xs text-muted-foreground">
                            Source: {observation.dataSource}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{observation.description}</p>

                  {observation.affectedAreas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Affected Areas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {observation.affectedAreas.map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {observation.dataEvidence && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium mb-2">Evidence:</p>
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(observation.dataEvidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-4">
          {coachingPlan.interventions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No action items yet</p>
                <p className="text-muted-foreground">
                  Run an analysis to get personalized recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            coachingPlan.interventions.map((intervention) => (
              <Card
                key={intervention.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedIntervention(intervention)
                  setInterventionNotes(intervention.notes || "")
                  setShowInterventionDialog(true)
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(intervention.status)}
                        {getPriorityBadge(intervention.priority)}
                        {getImpactBadge(intervention.estimatedImpact)}
                      </div>
                      <CardTitle className="text-lg">{intervention.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Effort: {intervention.estimatedEffort}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Impact: {intervention.estimatedImpact}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{intervention.description}</p>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      Action Items:
                    </p>
                    <div className="space-y-2">
                      {intervention.actionItems.map((item, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                          {item.resources && item.resources.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.resources.map((resource, rIndex) => (
                                <Badge key={rIndex} variant="outline" className="text-xs">
                                  <BookOpen className="mr-1 h-3 w-3" />
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {intervention.notes && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{intervention.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          {coachingPlan.assessments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No assessments yet</p>
                <p className="text-muted-foreground">Run an analysis to see detailed assessments.</p>
              </CardContent>
            </Card>
          ) : (
            coachingPlan.assessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{assessment.assessmentType.replace(/_/g, " ")}</Badge>
                        <Badge className={getMaturityColor(assessment.maturityLevel)}>
                          {assessment.maturityLevel}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{assessment.category}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        {Math.round(assessment.currentScore)}
                      </p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Progress value={assessment.currentScore} className="h-2" />
                  </div>

                  {assessment.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Strengths
                      </p>
                      <ul className="space-y-1 ml-6">
                        {assessment.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-muted-foreground list-disc">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.weaknesses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Areas for Improvement
                      </p>
                      <ul className="space-y-1 ml-6">
                        {assessment.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-muted-foreground list-disc">
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-600">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </p>
                      <ul className="space-y-1 ml-6">
                        {assessment.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground list-disc">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Intervention Dialog */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntervention && getStatusIcon(selectedIntervention.status)}
              {selectedIntervention?.title}
            </DialogTitle>
            <DialogDescription>Update status and add notes</DialogDescription>
          </DialogHeader>

          {selectedIntervention && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {getPriorityBadge(selectedIntervention.priority)}
                {getImpactBadge(selectedIntervention.estimatedImpact)}
                <Badge variant="outline">Effort: {selectedIntervention.estimatedEffort}</Badge>
              </div>

              <p className="text-sm">{selectedIntervention.description}</p>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Action Items:</p>
                <div className="space-y-2">
                  {selectedIntervention.actionItems.map((item, index) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  placeholder="Add notes about your progress..."
                  rows={4}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Update Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedIntervention.status === "IN_PROGRESS" ? "default" : "outline"}
                    onClick={() =>
                      updateInterventionStatus(
                        selectedIntervention.id,
                        "IN_PROGRESS",
                        interventionNotes
                      )
                    }
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                  <Button
                    variant={selectedIntervention.status === "COMPLETED" ? "default" : "outline"}
                    onClick={() =>
                      updateInterventionStatus(
                        selectedIntervention.id,
                        "COMPLETED",
                        interventionNotes
                      )
                    }
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                  <Button
                    variant={selectedIntervention.status === "DEFERRED" ? "default" : "outline"}
                    onClick={() =>
                      updateInterventionStatus(
                        selectedIntervention.id,
                        "DEFERRED",
                        interventionNotes
                      )
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Defer
                  </Button>
                  <Button
                    variant={selectedIntervention.status === "NOT_APPLICABLE" ? "default" : "outline"}
                    onClick={() =>
                      updateInterventionStatus(
                        selectedIntervention.id,
                        "NOT_APPLICABLE",
                        interventionNotes
                      )
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    N/A
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
