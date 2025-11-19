
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon,
  Trash2, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UploadedDocument {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  processingStatus: string
  uploadedAt: string
  extractedText?: string
}

export function DocumentUpload() {
  const { data: session } = useSession() || {}
  const { toast } = useToast()
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isReprocessing, setIsReprocessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch existing documents on mount
  useEffect(() => {
    if (session?.user) {
      fetchDocuments()
    }
  }, [session?.user])

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocuments(true)
      const response = await fetch('/api/documents')
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
      
    } catch (error) {
      console.error('Fetch documents error:', error)
      toast({
        title: "Failed to load documents",
        description: "Could not retrieve your uploaded documents",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <File className="h-5 w-5 text-red-500" />
    if (fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileText className="h-5 w-5 text-orange-500" />
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Ready'
      case 'PROCESSING':
        return 'Processing...'
      case 'FAILED':
        return 'Failed'
      default:
        return 'Pending...'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const uploadFileWithProgress = (file: File): Promise<UploadedDocument> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          resolve(result.document)
        } else {
          reject(new Error('Upload failed'))
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('POST', '/api/documents/upload')
      xhr.send(formData)
    })
  }

  const pollDocumentStatus = async (documentId: string) => {
    const maxAttempts = 30 // Poll for up to 30 seconds
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok) return

        const data = await response.json()
        
        // Update document in list
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, processingStatus: data.processingStatus, extractedText: data.extractedText }
              : doc
          )
        )

        // If still processing and haven't exceeded max attempts, poll again
        if (data.processingStatus === 'PROCESSING' || data.processingStatus === 'PENDING') {
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000) // Poll every second
          }
        }
      } catch (error) {
        console.error('Status poll error:', error)
      }
    }

    poll()
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        })
        return false
      }
      if (!supportedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      try {
        setUploadProgress(0)
        
        // Upload with progress tracking
        const document = await uploadFileWithProgress(file)
        
        // Add document to list
        setDocuments(prev => [...prev, document])
        
        toast({
          title: "Upload successful",
          description: `${file.name} uploaded and processing started`,
        })

        // Start polling for status updates
        pollDocumentStatus(document.id)

      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }

    setIsUploading(false)
    setUploadProgress(0)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const data = await response.json()
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.target = '_blank'
      link.click()
      
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const handleReprocessAll = async () => {
    try {
      setIsReprocessing(true)
      
      toast({
        title: "Processing documents",
        description: "Extracting text from your documents...",
      })

      const response = await fetch('/api/documents/reprocess', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Reprocessing failed')
      }

      const data = await response.json()
      
      toast({
        title: "Processing complete!",
        description: data.message,
      })

      // Refresh the document list to show updated statuses
      await fetchDocuments()
      
    } catch (error) {
      console.error('Reprocessing error:', error)
      toast({
        title: "Processing failed",
        description: "Failed to reprocess documents",
        variant: "destructive",
      })
    } finally {
      setIsReprocessing(false)
    }
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center">
          <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Document Upload & Analysis
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-600">
          Upload PDFs, Word documents, PowerPoint presentations, and images for Atlas to analyze
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Area - Mobile Optimized */}
        <div
          className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 transition-colors ${
            dragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            {dragActive ? '📂 Drop files here' : '📤 Upload documents'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-2">
            Drag and drop files here, or click to select files
          </p>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="sm"
          >
            Select Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="File upload input"
          />
          
          <p className="text-xs text-gray-500">
            Supports PDF, Word, PowerPoint, Images, and Text files (max 10MB each)
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex justify-between text-sm font-medium text-blue-900">
              <span>📤 Uploading file...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-xs text-blue-700">
              Your document will be processed automatically after upload
            </p>
          </div>
        )}

        {/* Documents List */}
        {isLoadingDocuments ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading your documents...</p>
          </div>
        ) : documents?.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Uploaded Documents ({documents.length})</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprocessAll}
                  disabled={isReprocessing}
                  className="text-xs"
                >
                  {isReprocessing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Extract Text
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDocuments}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {documents?.map((doc) => (
                <div key={doc?.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3 flex-1 min-w-0 mb-2 sm:mb-0">
                    {getFileIcon(doc?.fileType || "")}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {doc?.originalName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc?.fileSize || 0)}</span>
                        <span>•</span>
                        <span className="hidden sm:inline">{new Date(doc?.uploadedAt || "").toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(doc?.uploadedAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(doc?.processingStatus || "")}
                      <Badge 
                        variant={doc?.processingStatus === 'COMPLETED' ? 'default' : 'secondary'} 
                        className={`text-xs ${
                          doc?.processingStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          doc?.processingStatus === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                          doc?.processingStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getStatusLabel(doc?.processingStatus || 'PENDING')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc?.id || "", doc?.originalName || "")}
                        className="p-1 sm:p-2 hover:bg-blue-100 transition-colors"
                        aria-label="Download document"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc?.id || "")}
                        className="p-1 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 transition-colors"
                        aria-label="Delete document"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !isLoadingDocuments ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1">No documents uploaded yet</p>
            <p className="text-xs text-gray-500">Upload your first document to get started</p>
          </div>
        ) : null}

        {/* Community Learning Notice */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-2 flex items-center">
            🌟 Atlas Community Learning
          </h4>
          <p className="text-sm text-purple-800 mb-2">
            When you upload documents, Atlas learns from them and shares that knowledge with other users. This creates a 
            collaborative knowledge base where everyone benefits from shared training materials, templates, and best practices.
          </p>
          <ul className="text-xs text-purple-700 space-y-1 pl-4">
            <li>✓ Your documents help Atlas become smarter for everyone</li>
            <li>✓ Other users&apos; documents help enhance your experience</li>
            <li>✓ Templates are automatically replicated when users ask for similar ones</li>
            <li>✓ All shared knowledge is properly attributed to the source</li>
          </ul>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips for better analysis</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload Agile training materials, templates, and guides</li>
            <li>• Sprint planning sheets, retrospective templates are great additions</li>
            <li>• Atlas can extract text from images and scanned PDFs</li>
            <li>• Processed documents are searchable across all conversations</li>
            <li>• Templates you upload can be replicated for other users</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
