
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Database, 
  Trash2, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet,
  BarChart3,
  Users,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface JiraDataset {
  id: string
  name: string
  description?: string
  sourceType: string
  issueCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UploadAnalysis {
  totalIssues: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  byTeam: Record<string, number>
  bySprint: Record<string, number>
  missingStoryPoints: number
  uncommittedObjectives: number
  unassignedIssues: number
}

export function JiraDataManager() {
  const [datasets, setDatasets] = useState<JiraDataset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadAnalysis, setUploadAnalysis] = useState<UploadAnalysis | null>(null)
  
  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState("")
  const [datasetDescription, setDatasetDescription] = useState("")

  // Fetch datasets on load
  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/jira/datasets')
      if (response.ok) {
        const data = await response.json()
        setDatasets(data.datasets || [])
      } else {
        toast.error("Failed to load Jira datasets")
      }
    } catch (error) {
      console.error("Error fetching datasets:", error)
      toast.error("Failed to load datasets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Auto-generate name from filename
      if (!datasetName) {
        const name = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        setDatasetName(name)
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast.error("Please select a file")
      return
    }
    
    if (!datasetName.trim()) {
      toast.error("Please provide a dataset name")
      return
    }

    try {
      setIsUploading(true)
      setUploadAnalysis(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", datasetName.trim())
      if (datasetDescription.trim()) {
        formData.append("description", datasetDescription.trim())
      }

      const response = await fetch('/api/jira/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Successfully uploaded ${data.dataset.issueCount} Jira issues!`)
        setUploadAnalysis(data.analysis)
        
        // Reset form
        setFile(null)
        setDatasetName("")
        setDatasetDescription("")
        
        // Refresh datasets
        await fetchDatasets()
      } else {
        toast.error(data.error || "Failed to upload Jira data")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (datasetId: string) => {
    if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/jira/datasets?id=${datasetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Dataset deleted successfully")
        await fetchDatasets()
      } else {
        toast.error("Failed to delete dataset")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete dataset")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Jira Data Manager</CardTitle>
              <CardDescription className="text-base">
                Upload Jira exports (CSV/Excel) to unlock AI-powered backlog insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Form */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Jira Data</span>
          </CardTitle>
          <CardDescription>
            Export your Jira data as CSV or Excel and upload it here. Atlas will analyze it and answer questions like "Which teams are behind?" or "Which stories are missing story points?"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Select File (CSV or Excel)</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            <div>
              <Label htmlFor="name">Dataset Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Q4 2025 Sprint Data"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Data from Sprints 10-15 including all teams"
                value={datasetDescription}
                onChange={(e) => setDatasetDescription(e.target.value)}
                disabled={isUploading}
                className="mt-1"
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isUploading || !file}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Uploading & Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Jira Data
                </>
              )}
            </Button>
          </form>

          {/* Upload Analysis */}
          {uploadAnalysis && (
            <Alert className="mt-6 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-900">Upload Successful!</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                    <div>Total Issues: {uploadAnalysis.totalIssues}</div>
                    <div>Missing Story Points: {uploadAnalysis.missingStoryPoints}</div>
                    <div>Uncommitted: {uploadAnalysis.uncommittedObjectives}</div>
                    <div>Unassigned: {uploadAnalysis.unassignedIssues}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Existing Datasets */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Your Jira Datasets</span>
          </CardTitle>
          <CardDescription>
            Manage your uploaded Jira data. Activate a dataset to query it in Chat mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-muted-foreground mt-2">Loading datasets...</p>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-sm text-muted-foreground mt-2">No datasets yet. Upload your first Jira export above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{dataset.name}</h4>
                          {dataset.isActive && (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          )}
                        </div>
                        {dataset.description && (
                          <p className="text-sm text-muted-foreground mb-2">{dataset.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {dataset.issueCount} issues
                          </span>
                          <span className="flex items-center">
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            {dataset.sourceType.replace('_', ' ')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(dataset.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dataset.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="shadow-lg border-0 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>How to Use Jira Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h5 className="font-semibold mb-1">📊 Export from Jira:</h5>
            <p className="text-muted-foreground">
              In Jira, go to Issues → Search → Export → CSV or Excel. Make sure to include fields like: Issue Key, Summary, Status, Story Points, Assignee, Team, Sprint.
            </p>
          </div>
          <div>
            <h5 className="font-semibold mb-1">💬 Ask Questions:</h5>
            <p className="text-muted-foreground">
              Once uploaded, go to Chat and enable "Jira Mode". Then ask questions like:
            </p>
            <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
              <li>"Which teams are behind schedule?"</li>
              <li>"Show me stories missing story points"</li>
              <li>"What are the uncommitted objectives?"</li>
              <li>"Which high-priority bugs are unassigned?"</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-1">🎯 Atlas Insights:</h5>
            <p className="text-muted-foreground">
              Atlas analyzes thousands of tickets instantly and surfaces hidden patterns, blockers, and opportunities for improvement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
