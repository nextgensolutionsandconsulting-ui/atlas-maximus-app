
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Calendar, Tag, FileText, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

interface Session {
  id: string
  sessionNumber: number
  title: string | null
  summary: string | null
  topics: string[]
  decisions: any
  actionItems: any
  startedAt: Date
  endedAt: Date | null
  messageCount: number
}

export function ConversationMemory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/memory/sessions?limit=20')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to fetch conversation history')
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async (count: number = 3) => {
    try {
      setSummaryLoading(true)
      const response = await fetch(`/api/memory/summary?count=${count}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      } else {
        toast.error('Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error('Failed to generate summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  const searchHistory = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching:', error)
      toast.error('Search failed')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <h2 className="text-3xl font-bold text-gray-900">Conversation Memory</h2>
          <p className="text-gray-600 mt-1">
            Review past discussions, decisions, and insights
          </p>
        </div>
        <Button onClick={fetchSessions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {sessions.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation history yet</h3>
              <p className="text-gray-600">Start chatting with Atlas to build your conversation memory</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedSession?.id === session.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {session.title || `Session ${session.sessionNumber}`}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(session.startedAt)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{session.messageCount} msgs</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.summary && (
                      <p className="text-sm text-gray-700 line-clamp-2">{session.summary}</p>
                    )}
                    
                    {session.topics && session.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {session.topics.slice(0, 5).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedSession && (
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle>{selectedSession.title || `Session ${selectedSession.sessionNumber}`}</CardTitle>
                <CardDescription>{formatDate(selectedSession.startedAt)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSession.summary && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">{selectedSession.summary}</p>
                  </div>
                )}
                
                {selectedSession.topics && selectedSession.topics.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Topics Discussed</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedSession.decisions && Array.isArray(selectedSession.decisions) && selectedSession.decisions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Decisions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedSession.decisions.map((decision: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{decision}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSession.actionItems && Array.isArray(selectedSession.actionItems) && selectedSession.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Action Items</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedSession.actionItems.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Summary</CardTitle>
              <CardDescription>Get an AI-generated summary of your recent conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={() => generateSummary(3)} disabled={summaryLoading}>
                  Last 3 Sessions
                </Button>
                <Button onClick={() => generateSummary(5)} disabled={summaryLoading} variant="outline">
                  Last 5 Sessions
                </Button>
                <Button onClick={() => generateSummary(10)} disabled={summaryLoading} variant="outline">
                  Last 10 Sessions
                </Button>
              </div>
              
              {summaryLoading && (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Generating summary...</span>
                </div>
              )}
              
              {summary && !summaryLoading && (
                <ScrollArea className="h-96 border rounded-lg p-4">
                  <MarkdownRenderer content={summary} />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Conversation History</CardTitle>
              <CardDescription>Find specific topics, decisions, or discussions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search for topics, keywords, or phrases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchHistory()}
                />
                <Button onClick={searchHistory}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Results ({searchResults.length})</h4>
                  {searchResults.map((result) => (
                    <Card key={result.id}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {result.title || `Session ${result.sessionNumber}`}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(result.startedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {result.messages?.map((msg: any, idx: number) => (
                          <p key={idx} className="text-sm text-gray-700 mb-2">
                            {msg.content.substring(0, 200)}...
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
