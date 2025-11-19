
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  FileText, 
  Download, 
  Tag, 
  Shield, 
  Calendar, 
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Document {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  evidenceType?: string
  evidenceTags: string[]
  complianceNotes?: string
  retentionPeriod?: number
  expiryDate?: string
  uploadedAt: string
  lastAccessedAt?: string
  accessCount: number
}

interface AuditStats {
  totalEntries: number
  actionTypeCounts: Array<{ actionType: string; count: number }>
  evidenceTypeCounts: Array<{ evidenceType: string; count: number }>
  recentActivity: Array<{
    id: string
    timestamp: string
    actionType: string
    documentName?: string
    evidenceType?: string
  }>
}

const EVIDENCE_TYPES = [
  { value: "AUDIT_REPORT", label: "Audit Report", icon: "📋" },
  { value: "TRAINING_RECORD", label: "Training Record", icon: "🎓" },
  { value: "RISK_MITIGATION", label: "Risk Mitigation", icon: "⚠️" },
  { value: "SPRINT_RETROSPECTIVE", label: "Sprint Retrospective", icon: "🔄" },
  { value: "COMPLIANCE_CHECKLIST", label: "Compliance Checklist", icon: "✅" },
  { value: "SECURITY_SCAN", label: "Security Scan", icon: "🔒" },
  { value: "CODE_REVIEW", label: "Code Review", icon: "💻" },
  { value: "TEST_EVIDENCE", label: "Test Evidence", icon: "🧪" },
  { value: "CHANGE_CONTROL", label: "Change Control", icon: "📝" },
  { value: "INCIDENT_REPORT", label: "Incident Report", icon: "🚨" },
  { value: "POLICY_DOCUMENT", label: "Policy Document", icon: "📄" },
  { value: "STAKEHOLDER_APPROVAL", label: "Stakeholder Approval", icon: "✍️" },
  { value: "QUALITY_METRIC", label: "Quality Metric", icon: "📊" },
  { value: "CONTINUOUS_IMPROVEMENT", label: "Continuous Improvement", icon: "📈" },
  { value: "OTHER", label: "Other", icon: "📦" }
]

export function EvidenceTracker() {
  const { data: session } = useSession() || {}
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredType, setFilteredType] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null)
  
  // Tag form state
  const [evidenceType, setEvidenceType] = useState<string>("")
  const [evidenceTags, setEvidenceTags] = useState<string>("")
  const [complianceNotes, setComplianceNotes] = useState<string>("")
  const [retentionPeriod, setRetentionPeriod] = useState<string>("")

  useEffect(() => {
    fetchDocuments()
    fetchAuditStats()
  }, [filteredType])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const url = filteredType === "ALL" 
        ? '/api/documents'
        : `/api/evidence/tag?evidenceType=${filteredType}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditStats = async () => {
    try {
      const response = await fetch('/api/evidence/audit-trail', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setAuditStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error)
    }
  }

  const handleTagDocument = async () => {
    if (!selectedDoc || !evidenceType) {
      toast.error("Please select an evidence type")
      return
    }

    try {
      const response = await fetch('/api/evidence/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          evidenceType,
          evidenceTags: evidenceTags.split(',').map(t => t.trim()).filter(Boolean),
          complianceNotes,
          retentionPeriod: retentionPeriod ? parseInt(retentionPeriod) : null
        })
      })

      if (response.ok) {
        toast.success("Document tagged successfully")
        setTagDialogOpen(false)
        fetchDocuments()
        fetchAuditStats()
        // Reset form
        setEvidenceType("")
        setEvidenceTags("")
        setComplianceNotes("")
        setRetentionPeriod("")
        setSelectedDoc(null)
      } else {
        toast.error("Failed to tag document")
      }
    } catch (error) {
      console.error('Tagging error:', error)
      toast.error("Failed to tag document")
    }
  }

  const handleExportAuditTrail = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/evidence/audit-trail?format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-trail-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`Audit trail exported as ${format.toUpperCase()}`)
      } else {
        toast.error("Failed to export audit trail")
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Failed to export audit trail")
    }
  }

  const getEvidenceTypeInfo = (type?: string) => {
    return EVIDENCE_TYPES.find(t => t.value === type) || { label: 'Untagged', icon: '📄' }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiry <= thirtyDaysFromNow && expiry > now
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Regulatory Evidence Tracker</h2>
          <p className="text-muted-foreground mt-2">
            Prove compliance in seconds, not weeks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExportAuditTrail('csv')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportAuditTrail('json')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Evidence Documents</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tagged</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter(d => d.evidenceType).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter(d => isExpiringSoon(d.expiryDate)).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Actions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats?.totalEntries || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Evidence Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={filteredType} onValueChange={setFilteredType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Documents</SelectItem>
                  {EVIDENCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Documents</CardTitle>
              <CardDescription>
                Manage and track your compliance evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found. Upload documents to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => {
                    const typeInfo = getEvidenceTypeInfo(doc.evidenceType)
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">{typeInfo.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{doc.originalName}</h4>
                              {doc.evidenceType && (
                                <Badge variant="secondary">{typeInfo.label}</Badge>
                              )}
                              {isExpired(doc.expiryDate) && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                              {isExpiringSoon(doc.expiryDate) && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              {doc.retentionPeriod && ` • Retention: ${doc.retentionPeriod} months`}
                            </div>
                            {doc.evidenceTags && doc.evidenceTags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {doc.evidenceTags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {doc.complianceNotes && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {doc.complianceNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc)
                            setEvidenceType(doc.evidenceType || "")
                            setEvidenceTags(doc.evidenceTags.join(', '))
                            setComplianceNotes(doc.complianceNotes || "")
                            setRetentionPeriod(doc.retentionPeriod?.toString() || "")
                            setTagDialogOpen(true)
                          }}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          {doc.evidenceType ? 'Edit' : 'Tag'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Statistics */}
          {auditStats && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence Distribution</CardTitle>
                    <CardDescription>Documents by evidence type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(auditStats.evidenceTypeCounts || []).map((item, idx) => {
                        const typeInfo = getEvidenceTypeInfo(item.evidenceType)
                        return (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                        )
                      })}
                      {(!auditStats.evidenceTypeCounts || auditStats.evidenceTypeCounts.length === 0) && (
                        <p className="text-sm text-muted-foreground">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Action Summary</CardTitle>
                    <CardDescription>Audit trail by action type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(auditStats.actionTypeCounts || []).slice(0, 8).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{item.actionType.replace(/_/g, ' ')}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                      {(!auditStats.actionTypeCounts || auditStats.actionTypeCounts.length === 0) && (
                        <p className="text-sm text-muted-foreground">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest audit trail entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(auditStats.recentActivity || []).map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {entry.actionType.replace(/_/g, ' ')}
                            </span>
                            {entry.evidenceType && (
                              <Badge variant="secondary" className="text-xs">
                                {getEvidenceTypeInfo(entry.evidenceType).label}
                              </Badge>
                            )}
                          </div>
                          {entry.documentName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.documentName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!auditStats.recentActivity || auditStats.recentActivity.length === 0) && (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tag Evidence Document</DialogTitle>
            <DialogDescription>
              Add compliance metadata to {selectedDoc?.originalName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Evidence Type *</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={evidenceTags}
                onChange={(e) => setEvidenceTags(e.target.value)}
                placeholder="e.g., Q4-2024, critical, finance"
              />
            </div>

            <div>
              <Label>Retention Period (months)</Label>
              <Input
                type="number"
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                placeholder="e.g., 12, 24, 36"
              />
            </div>

            <div>
              <Label>Compliance Notes</Label>
              <Textarea
                value={complianceNotes}
                onChange={(e) => setComplianceNotes(e.target.value)}
                placeholder="Add notes for auditors..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTagDocument}>
                <Tag className="mr-2 h-4 w-4" />
                Save Tags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
