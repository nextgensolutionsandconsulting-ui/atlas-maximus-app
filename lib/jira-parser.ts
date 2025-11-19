
/**
 * Jira Data Parser
 * Handles parsing of CSV/Excel files containing Jira export data
 */

import { parse } from 'csv-parse/sync'

export interface ParsedJiraIssue {
  issueKey: string
  summary: string
  description?: string
  issueType?: string
  status?: string
  priority?: string
  storyPoints?: number
  assignee?: string
  reporter?: string
  team?: string
  sprint?: string
  epic?: string
  labels?: string[]
  dueDate?: Date
  createdDate?: Date
  updatedDate?: Date
  resolvedDate?: Date
  customFields?: Record<string, any>
}

/**
 * Parse CSV/Excel buffer into Jira issues
 */
export function parseJiraData(buffer: Buffer, mimeType: string): ParsedJiraIssue[] {
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return parseCSV(buffer)
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    // For Excel files, we'll convert to CSV first using a library
    return parseExcel(buffer)
  }
  
  throw new Error('Unsupported file type. Please upload CSV or Excel files.')
}

/**
 * Parse CSV buffer
 */
function parseCSV(buffer: Buffer): ParsedJiraIssue[] {
  const csvString = buffer.toString('utf-8')
  
  // Parse CSV with headers
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle BOM for UTF-8 files
  })

  return records.map((record: any) => parseRecord(record))
}

/**
 * Parse Excel buffer (convert to CSV first)
 */
function parseExcel(buffer: Buffer): ParsedJiraIssue[] {
  // Use xlsx library to read Excel
  const XLSX = require('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to CSV
  const csvString = XLSX.utils.sheet_to_csv(worksheet)
  
  // Parse CSV
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  return records.map((record: any) => parseRecord(record))
}

/**
 * Parse individual record and map to JiraIssue
 */
function parseRecord(record: any): ParsedJiraIssue {
  // Common field mappings (case-insensitive)
  const fieldMap: Record<string, string[]> = {
    issueKey: ['Issue key', 'Key', 'Issue Key', 'IssueKey', 'Issue ID', 'ID'],
    summary: ['Summary', 'Title', 'Issue Summary'],
    description: ['Description', 'Desc'],
    issueType: ['Issue Type', 'Type', 'IssueType'],
    status: ['Status', 'State'],
    priority: ['Priority', 'Pri'],
    storyPoints: ['Story Points', 'Points', 'Story Point', 'Estimate', 'StoryPoints'],
    assignee: ['Assignee', 'Assigned To', 'Owner'],
    reporter: ['Reporter', 'Created By', 'Requester'],
    team: ['Team', 'Component', 'Components', 'Project'],
    sprint: ['Sprint', 'Iteration', 'Sprint Name'],
    epic: ['Epic', 'Epic Link', 'Epic Name'],
    labels: ['Labels', 'Tags', 'Label'],
    dueDate: ['Due Date', 'Due', 'Target Date', 'Deadline'],
    createdDate: ['Created', 'Created Date', 'Creation Date'],
    updatedDate: ['Updated', 'Updated Date', 'Last Updated'],
    resolvedDate: ['Resolved', 'Resolved Date', 'Completion Date', 'Done Date'],
  }

  const issue: any = {
    issueKey: '',
    summary: '',
  }

  // Map fields
  for (const [targetField, possibleNames] of Object.entries(fieldMap)) {
    for (const name of possibleNames) {
      if (record[name] !== undefined && record[name] !== null && record[name] !== '') {
        const value = record[name]
        
        switch (targetField) {
          case 'storyPoints':
            issue.storyPoints = parseFloat(value) || undefined
            break
          case 'labels':
            // Split labels by comma or semicolon
            issue.labels = value.split(/[,;]/).map((l: string) => l.trim()).filter(Boolean)
            break
          case 'dueDate':
          case 'createdDate':
          case 'updatedDate':
          case 'resolvedDate':
            const date = parseDate(value)
            if (date) {
              issue[targetField] = date
            }
            break
          default:
            issue[targetField] = value.toString().trim()
        }
        break // Found a match, stop looking
      }
    }
  }

  // Validation: issueKey and summary are required
  if (!issue.issueKey || !issue.summary) {
    throw new Error(
      `Invalid record: Missing required fields (Issue Key or Summary). Record: ${JSON.stringify(record)}`
    )
  }

  // Collect custom fields (any field not in the standard map)
  const standardFieldNames = new Set(
    Object.values(fieldMap).flat().map(n => n.toLowerCase())
  )
  
  const customFields: Record<string, any> = {}
  for (const [key, value] of Object.entries(record)) {
    if (!standardFieldNames.has(key.toLowerCase()) && value !== null && value !== '') {
      customFields[key] = value
    }
  }
  
  if (Object.keys(customFields).length > 0) {
    issue.customFields = customFields
  }

  return issue as ParsedJiraIssue
}

/**
 * Parse date from various formats
 */
function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined
  
  try {
    // Try parsing as ISO date
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date
    }
  } catch (error) {
    // Ignore parse errors
  }
  
  return undefined
}

/**
 * Analyze Jira dataset and provide insights
 */
export function analyzeJiraDataset(issues: ParsedJiraIssue[]) {
  const analysis = {
    totalIssues: issues.length,
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byTeam: {} as Record<string, number>,
    bySprint: {} as Record<string, number>,
    missingStoryPoints: 0,
    uncommittedObjectives: 0,
    unassignedIssues: 0,
  }

  for (const issue of issues) {
    // Status
    if (issue.status) {
      analysis.byStatus[issue.status] = (analysis.byStatus[issue.status] || 0) + 1
    }
    
    // Type
    if (issue.issueType) {
      analysis.byType[issue.issueType] = (analysis.byType[issue.issueType] || 0) + 1
    }
    
    // Team
    if (issue.team) {
      analysis.byTeam[issue.team] = (analysis.byTeam[issue.team] || 0) + 1
    }
    
    // Sprint
    if (issue.sprint) {
      analysis.bySprint[issue.sprint] = (analysis.bySprint[issue.sprint] || 0) + 1
    }
    
    // Missing story points
    if (!issue.storyPoints || issue.storyPoints === 0) {
      analysis.missingStoryPoints++
    }
    
    // Uncommitted (no sprint assigned)
    if (!issue.sprint || issue.sprint.toLowerCase().includes('backlog')) {
      analysis.uncommittedObjectives++
    }
    
    // Unassigned
    if (!issue.assignee) {
      analysis.unassignedIssues++
    }
  }

  return analysis
}
