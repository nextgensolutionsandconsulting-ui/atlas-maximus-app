
"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { ChatInterface } from "./chat-interface"
import { Navigation } from "./navigation"
import { SubscriptionGate } from "./subscription-gate"
import { DocumentUpload } from "./document-upload"
import { UserProfile } from "./user-profile"
import { WorkflowSelector } from "./workflow-selector"
import { WorkflowExecution } from "./workflow-execution"
import { WorkflowDefinition } from "@/lib/workflows"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Upload, User, Settings, Workflow, Database, FileText, Sparkles, Shield, CalendarDays, BookOpen, Brain, TrendingUp, BarChart3, Users } from "lucide-react"
import { JiraDataManager } from "./jira-data-manager"
import { ReportGenerator } from "./report-generator"
import { CoachingCompanion } from "./coaching-companion"
import { EvidenceTracker } from "./evidence-tracker"
import { MeetingCoPilot } from "./meeting-copilot"
import { AskAtlas } from "./ask-atlas"
import { RiskDashboard } from "./risk-dashboard"
import { ConversationMemory } from "./conversation-memory"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { CollaborationWorkspace } from "./collaboration-workspace"

type ActiveTab = "chat" | "workflows" | "documents" | "profile" | "settings" | "jira" | "reports" | "coaching" | "evidence" | "meetings" | "knowledge" | "risk" | "memory" | "analytics" | "collaboration"

export function Dashboard() {
  const { data: session, status } = useSession() || {}
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat")
  const [documentsCount, setDocumentsCount] = useState(0)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false)

  // Fetch documents count
  useEffect(() => {
    const fetchDocumentsCount = async () => {
      try {
        const response = await fetch('/api/documents')
        if (response.ok) {
          const data = await response.json()
          setDocumentsCount(data.documents?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      }
    }
    fetchDocumentsCount()
  }, [activeTab])

  const handleWorkflowSelect = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow)
    setIsExecutingWorkflow(true)
  }

  const handleWorkflowComplete = () => {
    setIsExecutingWorkflow(false)
    setSelectedWorkflow(null)
    setActiveTab("chat")
  }

  const handleWorkflowCancel = () => {
    setIsExecutingWorkflow(false)
    setSelectedWorkflow(null)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Server will redirect
  }

  // Check subscription status
  const hasActiveSubscription = session?.user?.subscriptionStatus === "ACTIVE" || 
                                session?.user?.subscriptionStatus === "TRIALING" ||
                                session?.user?.isAdmin

  if (!hasActiveSubscription) {
    return <SubscriptionGate />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      <div className="pt-16 pb-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Welcome Header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
              Welcome back, {session?.user?.name || "Agile Professional"}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Your role: <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {session?.user?.agileRole?.replace(/_/g, ' ') || "Scrum Master"}
              </span>
            </p>
          </div>

          {/* Tab Navigation - Mobile Optimized */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex space-x-1 bg-white rounded-xl p-1 shadow-lg border border-gray-100 overflow-x-auto">
              <Button
                variant={activeTab === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "chat" 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Chat</span>
              </Button>
              <Button
                variant={activeTab === "workflows" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("workflows")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "workflows" 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Workflow className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Workflows</span>
              </Button>
              <Button
                variant={activeTab === "documents" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("documents")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "documents" 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Docs</span>
              </Button>
              <Button
                variant={activeTab === "knowledge" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("knowledge")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "knowledge" 
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Ask Atlas</span>
              </Button>
              <Button
                variant={activeTab === "jira" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("jira")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "jira" 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Jira</span>
              </Button>
              <Button
                variant={activeTab === "reports" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("reports")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "reports" 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Reports</span>
              </Button>
              <Button
                variant={activeTab === "coaching" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("coaching")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "coaching" 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Coaching</span>
              </Button>
              <Button
                variant={activeTab === "evidence" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("evidence")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "evidence" 
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Evidence</span>
              </Button>
              <Button
                variant={activeTab === "meetings" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("meetings")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "meetings" 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Meetings</span>
              </Button>
              <Button
                variant={activeTab === "risk" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("risk")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "risk" 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Risk</span>
              </Button>
              <Button
                variant={activeTab === "memory" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("memory")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "memory" 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Memory</span>
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "analytics" 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </Button>
              <Button
                variant={activeTab === "collaboration" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("collaboration")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "collaboration" 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Collaborate</span>
              </Button>
              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all ${
                  activeTab === "profile" 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Profile</span>
              </Button>
            </div>
          </div>

          {/* Main Content Area - Full Width */}
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4">
              {activeTab === "chat" && (
                <div className="animate-fade-in">
                  <ChatInterface />
                </div>
              )}
              {activeTab === "workflows" && (
                <div className="animate-fade-in">
                  {isExecutingWorkflow && selectedWorkflow ? (
                    <WorkflowExecution 
                      workflow={selectedWorkflow}
                      onComplete={handleWorkflowComplete}
                      onCancel={handleWorkflowCancel}
                    />
                  ) : (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <WorkflowSelector 
                          onWorkflowSelect={handleWorkflowSelect}
                          documentsCount={documentsCount}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {activeTab === "documents" && (
                <div className="animate-fade-in">
                  <DocumentUpload />
                </div>
              )}
              {activeTab === "knowledge" && (
                <div className="animate-fade-in">
                  <AskAtlas />
                </div>
              )}
              {activeTab === "jira" && (
                <div className="animate-fade-in">
                  <JiraDataManager />
                </div>
              )}
              {activeTab === "reports" && (
                <div className="animate-fade-in">
                  <ReportGenerator />
                </div>
              )}
              {activeTab === "coaching" && (
                <div className="animate-fade-in">
                  <CoachingCompanion />
                </div>
              )}
              {activeTab === "evidence" && (
                <div className="animate-fade-in">
                  <EvidenceTracker />
                </div>
              )}
              {activeTab === "meetings" && (
                <div className="animate-fade-in">
                  <MeetingCoPilot />
                </div>
              )}
              {activeTab === "risk" && (
                <div className="animate-fade-in">
                  <RiskDashboard />
                </div>
              )}
              {activeTab === "memory" && (
                <div className="animate-fade-in">
                  <ConversationMemory />
                </div>
              )}
              {activeTab === "analytics" && (
                <div className="animate-fade-in">
                  <AnalyticsDashboard />
                </div>
              )}
              {activeTab === "collaboration" && (
                <div className="animate-fade-in">
                  <CollaborationWorkspace />
                </div>
              )}
              {activeTab === "profile" && (
                <div className="animate-fade-in">
                  <UserProfile />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
