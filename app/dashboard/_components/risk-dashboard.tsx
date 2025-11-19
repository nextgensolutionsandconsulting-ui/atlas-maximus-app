
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, TrendingUp, TrendingDown, Minus, Plus, RefreshCw, Shield, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Team {
  id: string
  name: string
  description?: string
  currentSprint?: string
  members: string[]
  riskScore?: any
  riskColors?: any
  confidenceVoteCount: number
  objectiveCount: number
}

export function RiskDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // New team form
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    description: '',
    currentSprint: '',
    members: [] as string[]
  })
  
  // Confidence vote form
  const [isAddingVote, setIsAddingVote] = useState(false)
  const [voteData, setVoteData] = useState({
    sprint: '',
    objective: '',
    confidenceLevel: 3,
    votedBy: '',
    notes: ''
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/risk/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      toast.error('Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch('/api/risk/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamData)
      })
      
      if (response.ok) {
        toast.success('Team created successfully')
        setIsCreatingTeam(false)
        setNewTeamData({ name: '', description: '', currentSprint: '', members: [] })
        fetchTeams()
      } else {
        toast.error('Failed to create team')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error('Failed to create team')
    }
  }

  const analyzeTeamRisk = async (teamId: string, sprint: string) => {
    try {
      setIsAnalyzing(true)
      const response = await fetch('/api/risk/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, sprint, saveResult: true })
      })
      
      if (response.ok) {
        toast.success('Risk analysis complete')
        fetchTeams()
      } else {
        toast.error('Failed to analyze risk')
      }
    } catch (error) {
      console.error('Error analyzing risk:', error)
      toast.error('Failed to analyze risk')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const addConfidenceVote = async () => {
    if (!selectedTeam) return
    
    try {
      const response = await fetch('/api/risk/confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          ...voteData
        })
      })
      
      if (response.ok) {
        toast.success('Confidence vote recorded')
        setIsAddingVote(false)
        setVoteData({ sprint: '', objective: '', confidenceLevel: 3, votedBy: '', notes: '' })
        fetchTeams()
      } else {
        toast.error('Failed to record confidence vote')
      }
    } catch (error) {
      console.error('Error recording confidence vote:', error)
      toast.error('Failed to record confidence vote')
    }
  }

  const getRiskBadge = (riskLevel: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      MODERATE: 'bg-yellow-500 text-white',
      LOW: 'bg-green-500 text-white'
    }
    
    const icons: Record<string, any> = {
      CRITICAL: AlertCircle,
      HIGH: AlertTriangle,
      MODERATE: Minus,
      LOW: Shield
    }
    
    const Icon = icons[riskLevel] || Shield
    
    return (
      <Badge className={colors[riskLevel] || 'bg-gray-500 text-white'}>
        <Icon className="h-3 w-3 mr-1" />
        {riskLevel}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team Risk Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Analyze confidence votes, velocity, throughput, and objective health
          </p>
        </div>
        <Button onClick={() => setIsCreatingTeam(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Create Team Dialog */}
      {isCreatingTeam && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>Add a team to track risk and confidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                placeholder="e.g., Alpha Team"
              />
            </div>
            <div>
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                placeholder="Brief description of the team"
              />
            </div>
            <div>
              <Label htmlFor="current-sprint">Current Sprint</Label>
              <Input
                id="current-sprint"
                value={newTeamData.currentSprint}
                onChange={(e) => setNewTeamData({ ...newTeamData, currentSprint: e.target.value })}
                placeholder="e.g., Sprint 42"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createTeam} className="flex-1">Create Team</Button>
              <Button onClick={() => setIsCreatingTeam(false)} variant="outline" className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-4">Create your first team to start tracking risk</p>
          <Button onClick={() => setIsCreatingTeam(true)}>Create Team</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                team.riskScore?.riskLevel ? team.riskColors?.bg : 'bg-white'
              } ${selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTeam(team)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {team.currentSprint || 'No active sprint'}
                    </CardDescription>
                  </div>
                  {team.riskScore && getRiskBadge(team.riskScore.riskLevel)}
                </div>
              </CardHeader>
              <CardContent>
                {team.riskScore ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risk Score</span>
                        <span className="font-semibold">{team.riskScore.overallRiskScore}/100</span>
                      </div>
                      <Progress value={team.riskScore.overallRiskScore} className="h-2" />
                    </div>
                    
                    {team.riskScore.confidenceScore && (
                      <div className="text-sm">
                        <span className="text-gray-600">Confidence: </span>
                        <span className="font-medium">{team.riskScore.confidenceScore.toFixed(1)}/5</span>
                      </div>
                    )}
                    
                    {team.riskScore.velocityScore && (
                      <div className="text-sm">
                        <span className="text-gray-600">Velocity: </span>
                        <span className="font-medium">{team.riskScore.velocityScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm mb-2">No risk data yet</p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (team.currentSprint) {
                          analyzeTeamRisk(team.id, team.currentSprint)
                        } else {
                          toast.error('Please set a current sprint first')
                        }
                      }}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Risk'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Team Details */}
      {selectedTeam && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedTeam.name}</CardTitle>
                <CardDescription>{selectedTeam.description}</CardDescription>
              </div>
              <Button
                onClick={() => {
                  if (selectedTeam.currentSprint) {
                    analyzeTeamRisk(selectedTeam.id, selectedTeam.currentSprint)
                  } else {
                    toast.error('Please set a current sprint first')
                  }
                }}
                disabled={isAnalyzing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh Analysis
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="confidence">Confidence Votes</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                {selectedTeam.riskScore ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Overall Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{selectedTeam.riskScore.overallRiskScore}/100</div>
                          {getRiskBadge(selectedTeam.riskScore.riskLevel)}
                        </CardContent>
                      </Card>
                      
                      {selectedTeam.riskScore.confidenceScore && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Team Confidence</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{selectedTeam.riskScore.confidenceScore.toFixed(1)}/5</div>
                            <Progress value={(selectedTeam.riskScore.confidenceScore / 5) * 100} className="mt-2" />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {selectedTeam.riskScore.factors?.description?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Risk Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedTeam.riskScore.factors.description.map((factor: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5" />
                                <span className="text-sm">{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">No risk analysis available. Click "Refresh Analysis" to generate.</p>
                )}
              </TabsContent>
              
              <TabsContent value="confidence" className="space-y-4">
                <Button onClick={() => setIsAddingVote(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Confidence Vote
                </Button>
                
                {isAddingVote && (
                  <Card className="border-2 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-sm">Record Confidence Vote</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="sprint">Sprint</Label>
                        <Input
                          id="sprint"
                          value={voteData.sprint}
                          onChange={(e) => setVoteData({ ...voteData, sprint: e.target.value })}
                          placeholder="e.g., Sprint 42"
                        />
                      </div>
                      <div>
                        <Label htmlFor="objective">Objective</Label>
                        <Input
                          id="objective"
                          value={voteData.objective}
                          onChange={(e) => setVoteData({ ...voteData, objective: e.target.value })}
                          placeholder="What are we committing to?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="voted-by">Team Member</Label>
                        <Input
                          id="voted-by"
                          value={voteData.votedBy}
                          onChange={(e) => setVoteData({ ...voteData, votedBy: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confidence">Confidence Level: {voteData.confidenceLevel}/5</Label>
                        <Input
                          id="confidence"
                          type="range"
                          min="1"
                          max="5"
                          value={voteData.confidenceLevel}
                          onChange={(e) => setVoteData({ ...voteData, confidenceLevel: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={voteData.notes}
                          onChange={(e) => setVoteData({ ...voteData, notes: e.target.value })}
                          placeholder="Any concerns or comments?"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={addConfidenceVote} className="flex-1">Submit Vote</Button>
                        <Button onClick={() => setIsAddingVote(false)} variant="outline" className="flex-1">Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <p className="text-sm text-gray-600">
                  {selectedTeam.confidenceVoteCount} confidence vote(s) recorded
                </p>
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-4">
                {selectedTeam.riskScore?.recommendations?.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">AI-Generated Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedTeam.riskScore.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                              <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                            </div>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-gray-500 py-8">No recommendations available. Generate a risk analysis first.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
