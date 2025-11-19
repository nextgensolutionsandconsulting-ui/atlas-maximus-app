"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Plus, 
  FileText, 
  Users, 
  CheckSquare, 
  Mic, 
  Download, 
  Play, 
  Save,
  Sparkles,
  CalendarDays,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { AgendaItem, MeetingContext } from "@/lib/meeting-copilot"

interface Meeting {
  id: string
  title: string
  meetingType: string
  scheduledFor: string | null
  duration: number | null
  status: string
  agenda: AgendaItem[] | null
  sprintContext: string | null
  piContext: string | null
  attendees: string[]
  location: string | null
  notes: string | null
  actionItems: any[] | null
  decisions: any[] | null
  transcripts: Array<{
    id: string
    speaker: string | null
    content: string
    timestamp: string
    isVoice: boolean
  }>
}

const MEETING_TYPES = [
  { value: 'SPRINT_PLANNING', label: 'Sprint Planning' },
  { value: 'DAILY_STANDUP', label: 'Daily Standup' },
  { value: 'SPRINT_REVIEW', label: 'Sprint Review' },
  { value: 'SPRINT_RETROSPECTIVE', label: 'Sprint Retrospective' },
  { value: 'PI_PLANNING', label: 'PI Planning' },
  { value: 'BACKLOG_REFINEMENT', label: 'Backlog Refinement' },
  { value: 'TEAM_SYNC', label: 'Team Sync' },
  { value: 'STAKEHOLDER_DEMO', label: 'Stakeholder Demo' },
  { value: 'ARCHITECTURE_REVIEW', label: 'Architecture Review' },
  { value: 'IMPEDIMENT_REMOVAL', label: 'Impediment Removal' },
  { value: 'ONE_ON_ONE', label: '1:1 Meeting' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function MeetingCoPilot() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list')
  
  // Form state for creating a new meeting
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    meetingType: 'DAILY_STANDUP',
    scheduledFor: '',
    duration: 30,
    attendees: '',
    location: '',
    sprintContext: '',
    piContext: '',
  })

  // Transcript state
  const [newTranscript, setNewTranscript] = useState({
    speaker: '',
    content: '',
  })

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/meetings')
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      } else {
        toast.error('Failed to load meetings')
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast.error('Failed to load meetings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMeeting = async () => {
    try {
      if (!newMeeting.title || !newMeeting.meetingType) {
        toast.error('Please fill in required fields')
        return
      }

      const attendeesArray = newMeeting.attendees
        .split(',')
        .map((a: string) => a.trim())
        .filter(Boolean)

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMeeting,
          attendees: attendeesArray,
          scheduledFor: newMeeting.scheduledFor || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Meeting created successfully')
        setIsCreating(false)
        setNewMeeting({
          title: '',
          meetingType: 'DAILY_STANDUP',
          scheduledFor: '',
          duration: 30,
          attendees: '',
          location: '',
          sprintContext: '',
          piContext: '',
        })
        await fetchMeetings()
        setSelectedMeeting(data.meeting)
        setActiveTab('details')
      } else {
        toast.error('Failed to create meeting')
      }
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast.error('Failed to create meeting')
    }
  }

  const handleGenerateAgenda = async (meetingId: string) => {
    try {
      const meeting = meetings.find(m => m.id === meetingId)
      if (!meeting) return

      const context: MeetingContext = {
        sprintName: meeting.sprintContext || undefined,
      }

      const response = await fetch(`/api/meetings/${meetingId}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedMeeting(data.meeting)
        toast.success('Agenda generated successfully')
        await fetchMeetings()
      } else {
        toast.error('Failed to generate agenda')
      }
    } catch (error) {
      console.error('Error generating agenda:', error)
      toast.error('Failed to generate agenda')
    }
  }

  const handleAddTranscript = async () => {
    if (!selectedMeeting || !newTranscript.content) {
      toast.error('Please enter transcript content')
      return
    }

    try {
      const response = await fetch(`/api/meetings/${selectedMeeting.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTranscript),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedMeeting({
          ...selectedMeeting,
          transcripts: [...selectedMeeting.transcripts, data.transcript],
        })
        setNewTranscript({ speaker: '', content: '' })
        toast.success('Transcript added')
        await fetchMeetings()
      } else {
        toast.error('Failed to add transcript')
      }
    } catch (error) {
      console.error('Error adding transcript:', error)
      toast.error('Failed to add transcript')
    }
  }

  const handleGenerateNotes = async () => {
    if (!selectedMeeting) return

    try {
      const response = await fetch(`/api/meetings/${selectedMeeting.id}/notes`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedMeeting(data.meeting)
        toast.success('Meeting notes generated')
        await fetchMeetings()
      } else {
        toast.error('Failed to generate notes')
      }
    } catch (error) {
      console.error('Error generating notes:', error)
      toast.error('Failed to generate notes')
    }
  }

  const handleDownloadNotes = () => {
    if (!selectedMeeting?.notes) return

    const blob = new Blob([selectedMeeting.notes], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedMeeting.title.replace(/\s+/g, '-')}-notes.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <CalendarDays className="mr-2 h-6 w-6" />
                Meeting Co-Pilot
              </CardTitle>
              <CardDescription className="text-white/90">
                Prep agendas, track discussions, and generate meeting notes
              </CardDescription>
            </div>
            {activeTab === 'list' && (
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Meeting
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Create Meeting Form */}
      {isCreating && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create New Meeting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g., Sprint 42 Planning"
                />
              </div>
              <div>
                <Label htmlFor="meetingType">Meeting Type *</Label>
                <Select
                  value={newMeeting.meetingType}
                  onValueChange={(value) => setNewMeeting({ ...newMeeting, meetingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduledFor">Scheduled Date & Time</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={newMeeting.scheduledFor}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduledFor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newMeeting.duration}
                  onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                <Input
                  id="attendees"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                  placeholder="John Doe, Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  placeholder="Conference Room A or Zoom link"
                />
              </div>
              <div>
                <Label htmlFor="sprintContext">Sprint Context</Label>
                <Input
                  id="sprintContext"
                  value={newMeeting.sprintContext}
                  onChange={(e) => setNewMeeting({ ...newMeeting, sprintContext: e.target.value })}
                  placeholder="Sprint 42"
                />
              </div>
              <div>
                <Label htmlFor="piContext">PI Context</Label>
                <Input
                  id="piContext"
                  value={newMeeting.piContext}
                  onChange={(e) => setNewMeeting({ ...newMeeting, piContext: e.target.value })}
                  placeholder="PI 2025.1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateMeeting} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Create Meeting
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list">Meeting List</TabsTrigger>
          {selectedMeeting && <TabsTrigger value="details">Meeting Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {meetings.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No meetings yet. Create your first meeting!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <Card 
                      key={meeting.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedMeeting(meeting)
                        setActiveTab('details')
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{meeting.title}</h3>
                              <Badge className={STATUS_COLORS[meeting.status]}>
                                {meeting.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <FileText className="mr-1 h-4 w-4" />
                                {MEETING_TYPES.find(t => t.value === meeting.meetingType)?.label}
                              </span>
                              {meeting.scheduledFor && (
                                <span className="flex items-center">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  {new Date(meeting.scheduledFor).toLocaleString()}
                                </span>
                              )}
                              {meeting.duration && (
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {meeting.duration} min
                                </span>
                              )}
                              {meeting.attendees.length > 0 && (
                                <span className="flex items-center">
                                  <Users className="mr-1 h-4 w-4" />
                                  {meeting.attendees.length} attendees
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMeeting(meeting)
                              setActiveTab('details')
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          {selectedMeeting && (
            <div className="space-y-4">
              {/* Meeting Info */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedMeeting.title}</CardTitle>
                      <CardDescription>
                        {MEETING_TYPES.find(t => t.value === selectedMeeting.meetingType)?.label}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[selectedMeeting.status]}>
                      {selectedMeeting.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedMeeting.scheduledFor && (
                      <div>
                        <span className="font-semibold">Scheduled:</span>{' '}
                        {new Date(selectedMeeting.scheduledFor).toLocaleString()}
                      </div>
                    )}
                    {selectedMeeting.duration && (
                      <div>
                        <span className="font-semibold">Duration:</span> {selectedMeeting.duration} minutes
                      </div>
                    )}
                    {selectedMeeting.location && (
                      <div>
                        <span className="font-semibold">Location:</span> {selectedMeeting.location}
                      </div>
                    )}
                    {selectedMeeting.attendees.length > 0 && (
                      <div>
                        <span className="font-semibold">Attendees:</span>{' '}
                        {selectedMeeting.attendees.join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Agenda */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <CheckSquare className="mr-2 h-5 w-5" />
                      Meeting Agenda
                    </CardTitle>
                    {!selectedMeeting.agenda && (
                      <Button 
                        onClick={() => handleGenerateAgenda(selectedMeeting.id)}
                        size="sm"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Agenda
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedMeeting.agenda ? (
                    <div className="space-y-4">
                      {(selectedMeeting.agenda as AgendaItem[]).map((item, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              {item.presenter && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Presenter: {item.presenter}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">{item.duration} min</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      No agenda generated yet. Click "Generate Agenda" to create one based on best practices.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Transcripts */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Discussion Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add Transcript Form */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-2">
                        <Input
                          placeholder="Speaker name (optional)"
                          value={newTranscript.speaker}
                          onChange={(e) => setNewTranscript({ ...newTranscript, speaker: e.target.value })}
                        />
                        <Textarea
                          placeholder="What was discussed..."
                          value={newTranscript.content}
                          onChange={(e) => setNewTranscript({ ...newTranscript, content: e.target.value })}
                          rows={3}
                        />
                        <Button onClick={handleAddTranscript} size="sm" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Transcript
                        </Button>
                      </div>
                    </div>

                    {/* Transcript List */}
                    {selectedMeeting.transcripts.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedMeeting.transcripts.map((transcript) => (
                          <div key={transcript.id} className="border-l-2 border-gray-300 pl-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              {transcript.speaker && (
                                <span className="font-semibold text-sm">{transcript.speaker}</span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(transcript.timestamp).toLocaleTimeString()}
                              </span>
                              {transcript.isVoice && (
                                <Badge variant="outline" className="text-xs">
                                  <Mic className="h-3 w-3 mr-1" />
                                  Voice
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{transcript.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-4">
                        No transcript entries yet. Add discussion points above.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Notes */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Meeting Notes
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedMeeting.transcripts.length > 0 && (
                        <Button onClick={handleGenerateNotes} size="sm" variant="outline">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Notes
                        </Button>
                      )}
                      {selectedMeeting.notes && (
                        <Button onClick={handleDownloadNotes} size="sm" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedMeeting.notes ? (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {selectedMeeting.notes}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      No meeting notes yet. Add transcript entries and click "Generate Notes" to create a summary.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
