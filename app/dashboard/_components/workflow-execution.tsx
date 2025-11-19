
"use client"

import { useState, useEffect } from 'react'
import { WorkflowDefinition } from '@/lib/workflows'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Download,
  FileText,
  ArrowLeft,
  Presentation,
  FileDown
} from 'lucide-react'

interface WorkflowExecutionProps {
  workflow: WorkflowDefinition
  onComplete: () => void
  onCancel: () => void
}

interface StepResult {
  stepId: string
  stepName: string
  result: string
  status: 'pending' | 'running' | 'completed' | 'error'
}

export function WorkflowExecution({ workflow, onComplete, onCancel }: WorkflowExecutionProps) {
  const { toast } = useToast()
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepResults, setStepResults] = useState<StepResult[]>([])
  const [finalOutput, setFinalOutput] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    executeWorkflow()
  }, [])

  const executeWorkflow = async () => {
    setIsExecuting(true)
    setError('')

    try {
      // Initialize step results
      const initialResults: StepResult[] = workflow.steps.map(step => ({
        stepId: step.id,
        stepName: step.name,
        result: '',
        status: 'pending'
      }))
      setStepResults(initialResults)

      // Execute workflow
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute workflow')
      }

      const data = await response.json()

      // Update with completed steps
      const completedResults: StepResult[] = data.steps.map((step: any) => ({
        stepId: step.stepId,
        stepName: step.stepName,
        result: step.result,
        status: 'completed' as const
      }))
      setStepResults(completedResults)
      setCurrentStepIndex(workflow.steps.length)
      setFinalOutput(data.finalOutput)

      toast({
        title: "Workflow Completed!",
        description: `${workflow.name} has finished successfully.`,
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast({
        title: "Workflow Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadMarkdown = () => {
    const blob = new Blob([finalOutput], { type: 'text/markdown' })
    const filename = `${workflow.id}-${Date.now()}.md`
    downloadBlob(blob, filename)

    toast({
      title: "Downloaded!",
      description: "Markdown file saved successfully.",
    })
  }

  const handleExportPowerPoint = async () => {
    try {
      toast({
        title: "Generating PowerPoint...",
        description: "Please wait while we create your presentation.",
      })

      const response = await fetch('/api/workflows/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pptx',
          workflowName: workflow.name,
          content: finalOutput,
          outputType: workflow.outputType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PowerPoint')
      }

      const blob = await response.blob()
      const filename = `${workflow.id}-${Date.now()}.pptx`
      downloadBlob(blob, filename)

      toast({
        title: "Exported!",
        description: "PowerPoint presentation saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PowerPoint presentation.",
        variant: "destructive",
      })
    }
  }

  const handleExportPDF = async () => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your document.",
      })

      const response = await fetch('/api/workflows/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          workflowName: workflow.name,
          content: finalOutput,
          outputType: workflow.outputType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const filename = `${workflow.id}-${Date.now()}.pdf`
      downloadBlob(blob, filename)

      toast({
        title: "Exported!",
        description: "PDF document saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF document.",
        variant: "destructive",
      })
    }
  }

  const progress = (currentStepIndex / workflow.steps.length) * 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{workflow.name}</span>
              {isExecuting && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              {!isExecuting && !error && finalOutput && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {error && <XCircle className="h-5 w-5 text-red-600" />}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {isExecuting ? 'Executing...' : error ? 'Failed' : 'Completed'}
              </span>
              <span className="text-sm text-gray-600">
                {currentStepIndex} / {workflow.steps.length} steps
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Progress */}
          <ScrollArea className="h-[200px] rounded-md border p-4">
            <div className="space-y-3">
              {workflow.steps.map((step, index) => {
                const stepResult = stepResults[index]
                const status = stepResult?.status || 'pending'

                return (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {status === 'running' && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      )}
                      {status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className={`font-medium text-sm ${
                        status === 'completed' ? 'text-green-700' : 
                        status === 'running' ? 'text-blue-700' : 
                        'text-gray-600'
                      }`}>
                        {step.name}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {finalOutput && !error && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Workflow Output</span>
                </h4>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleDownloadMarkdown}>
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Download as Markdown</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPowerPoint}>
                      <Presentation className="h-4 w-4 mr-2" />
                      <span>Export as PowerPoint</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      <span>Export as PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4 bg-gray-50">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {finalOutput}
                </pre>
              </ScrollArea>

              <Button onClick={onComplete} className="w-full" size="lg">
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
