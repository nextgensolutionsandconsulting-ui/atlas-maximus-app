
"use client"

import { useState } from 'react'
import { WORKFLOWS, WorkflowDefinition } from '@/lib/workflows'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Presentation, 
  ShieldAlert, 
  CheckCircle, 
  RefreshCw, 
  List, 
  AlertTriangle,
  Play,
  Clock,
  FileText,
  Sparkles
} from 'lucide-react'

interface WorkflowSelectorProps {
  onWorkflowSelect: (workflow: WorkflowDefinition) => void
  documentsCount: number
}

const ICON_MAP = {
  'presentation': Presentation,
  'shield-alert': ShieldAlert,
  'check-circle': CheckCircle,
  'refresh-cw': RefreshCw,
  'list': List,
  'alert-triangle': AlertTriangle,
}

const CATEGORY_LABELS = {
  'planning': { label: 'Planning', color: 'blue' },
  'analysis': { label: 'Analysis', color: 'purple' },
  'training': { label: 'Training', color: 'green' },
  'reporting': { label: 'Reporting', color: 'orange' },
}

export function WorkflowSelector({ onWorkflowSelect, documentsCount }: WorkflowSelectorProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleWorkflowClick = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow)
    setShowDetails(true)
  }

  const handleExecuteWorkflow = () => {
    if (selectedWorkflow) {
      onWorkflowSelect(selectedWorkflow)
      setShowDetails(false)
    }
  }

  const WorkflowCard = ({ workflow }: { workflow: WorkflowDefinition }) => {
    const Icon = ICON_MAP[workflow.icon as keyof typeof ICON_MAP] || FileText
    const category = CATEGORY_LABELS[workflow.category]

    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-blue-400"
        onClick={() => handleWorkflowClick(workflow)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{workflow.name}</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs">
                  {category.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm mb-3">
            {workflow.description}
          </CardDescription>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{workflow.estimatedTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>{workflow.steps.length} steps</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Available Workflows</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Execute multi-step workflows to generate comprehensive deliverables
            </p>
          </div>
          {documentsCount > 0 && (
            <Badge variant="outline" className="text-sm">
              {documentsCount} document{documentsCount !== 1 ? 's' : ''} ready
            </Badge>
          )}
        </div>

        {documentsCount === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">
                Please upload and process documents before running workflows. Workflows analyze your documents to generate deliverables.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORKFLOWS.map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </TabsContent>

          {Object.entries(CATEGORY_LABELS).map(([category, _]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOWS.filter(w => w.category === category).map(workflow => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Workflow Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedWorkflow && (
                <>
                  {(() => {
                    const Icon = ICON_MAP[selectedWorkflow.icon as keyof typeof ICON_MAP] || FileText
                    return <Icon className="h-6 w-6 text-blue-600" />
                  })()}
                  <span>{selectedWorkflow.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Estimated time: {selectedWorkflow.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Output: {selectedWorkflow.outputType}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Workflow Steps:</h4>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-3">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{step.name}</h5>
                          <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {documentsCount === 0 ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-yellow-800">
                      Please upload documents before executing this workflow
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Button 
                  onClick={handleExecuteWorkflow}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Workflow
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
