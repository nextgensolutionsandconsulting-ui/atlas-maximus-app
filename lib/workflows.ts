
// Workflow definitions and execution engine for Atlas Maximus

export interface WorkflowStep {
  id: string
  name: string
  description: string
  prompt: string
  outputFormat?: 'text' | 'json' | 'markdown'
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'planning' | 'analysis' | 'training' | 'reporting'
  steps: WorkflowStep[]
  outputType: 'document' | 'presentation' | 'report' | 'scorecard'
  estimatedTime: string
}

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'pi-briefing',
    name: 'PI Planning Briefing',
    description: 'Generate a comprehensive Program Increment planning briefing with objectives, features, and capacity analysis',
    icon: 'presentation',
    category: 'planning',
    outputType: 'presentation',
    estimatedTime: '2-3 minutes',
    steps: [
      {
        id: 'analyze-objectives',
        name: 'Analyze Objectives',
        description: 'Extract and analyze PI objectives from documents',
        prompt: 'Analyze the uploaded documents and extract all Program Increment objectives, goals, and business drivers. Format as a structured list with priorities.',
        outputFormat: 'json'
      },
      {
        id: 'identify-features',
        name: 'Identify Features',
        description: 'List planned features and capabilities',
        prompt: 'From the documents, identify all planned features, epics, and capabilities for this PI. Include effort estimates if available.',
        outputFormat: 'json'
      },
      {
        id: 'capacity-analysis',
        name: 'Capacity Analysis',
        description: 'Analyze team capacity and resource allocation',
        prompt: 'Analyze team capacity, velocity, and resource availability mentioned in the documents. Identify any capacity constraints or risks.',
        outputFormat: 'json'
      },
      {
        id: 'create-briefing',
        name: 'Generate Briefing',
        description: 'Create comprehensive PI briefing',
        prompt: 'Create a comprehensive PI Planning briefing presentation with: executive summary, PI objectives, feature roadmap, capacity plan, risks, and dependencies. Format as a structured presentation outline.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'compliance-risk',
    name: 'Compliance Risk Assessment',
    description: 'Analyze documents for compliance risks and provide detailed risk scores',
    icon: 'shield-alert',
    category: 'analysis',
    outputType: 'scorecard',
    estimatedTime: '1-2 minutes',
    steps: [
      {
        id: 'identify-requirements',
        name: 'Identify Requirements',
        description: 'Extract compliance requirements',
        prompt: 'Identify all compliance requirements, standards, and regulatory obligations mentioned in the documents.',
        outputFormat: 'json'
      },
      {
        id: 'assess-gaps',
        name: 'Gap Analysis',
        description: 'Analyze compliance gaps',
        prompt: 'Analyze gaps between current state and compliance requirements. Identify areas of non-compliance or risk.',
        outputFormat: 'json'
      },
      {
        id: 'calculate-scores',
        name: 'Risk Scoring',
        description: 'Calculate risk scores',
        prompt: 'Calculate compliance risk scores (0-100) for each area: Documentation, Process Adherence, Quality Standards, Security, and Overall. Provide justification for each score.',
        outputFormat: 'json'
      },
      {
        id: 'recommendations',
        name: 'Recommendations',
        description: 'Generate remediation recommendations',
        prompt: 'Provide specific, actionable recommendations to address compliance risks and improve scores. Prioritize by severity.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'decision-summary',
    name: 'Decision Summary',
    description: 'Extract key decisions, action items, and owners from meeting notes and documents',
    icon: 'check-circle',
    category: 'reporting',
    outputType: 'report',
    estimatedTime: '1-2 minutes',
    steps: [
      {
        id: 'extract-decisions',
        name: 'Extract Decisions',
        description: 'Identify all decisions made',
        prompt: 'Extract all decisions made from the documents. Include decision context, rationale, and date if available.',
        outputFormat: 'json'
      },
      {
        id: 'identify-actions',
        name: 'Action Items',
        description: 'List action items and owners',
        prompt: 'Identify all action items, their owners, due dates, and status. Flag any overdue or at-risk items.',
        outputFormat: 'json'
      },
      {
        id: 'track-dependencies',
        name: 'Dependencies',
        description: 'Identify dependencies and blockers',
        prompt: 'Identify dependencies between decisions/actions and any blockers or risks that could impact execution.',
        outputFormat: 'json'
      },
      {
        id: 'create-summary',
        name: 'Generate Summary',
        description: 'Create executive summary',
        prompt: 'Create a concise executive summary document with: key decisions, critical action items, dependencies, and next steps.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'training-deck',
    name: 'Training Deck Generator',
    description: 'Create customized training presentations based on uploaded content',
    icon: 'presentation',
    category: 'training',
    outputType: 'presentation',
    estimatedTime: '2-3 minutes',
    steps: [
      {
        id: 'extract-concepts',
        name: 'Extract Key Concepts',
        description: 'Identify main topics and concepts',
        prompt: 'Identify and extract the main concepts, topics, and learning objectives from the uploaded training materials.',
        outputFormat: 'json'
      },
      {
        id: 'structure-content',
        name: 'Structure Content',
        description: 'Organize into training modules',
        prompt: 'Organize the concepts into a logical training flow with modules, lessons, and learning objectives. Include estimated duration for each module.',
        outputFormat: 'json'
      },
      {
        id: 'create-examples',
        name: 'Generate Examples',
        description: 'Create practical examples',
        prompt: 'For each concept, create practical examples, scenarios, or case studies that illustrate the concept in action.',
        outputFormat: 'json'
      },
      {
        id: 'create-deck',
        name: 'Generate Deck',
        description: 'Create training presentation',
        prompt: 'Create a comprehensive training deck with: title slide, agenda, concept slides with examples, practice exercises, summary, and Q&A. Format as a presentation outline.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'retrospective-report',
    name: 'Sprint Retrospective Report',
    description: 'Analyze retrospective feedback and generate actionable insights',
    icon: 'refresh-cw',
    category: 'reporting',
    outputType: 'report',
    estimatedTime: '1-2 minutes',
    steps: [
      {
        id: 'categorize-feedback',
        name: 'Categorize Feedback',
        description: 'Organize feedback into themes',
        prompt: 'Analyze the retrospective feedback and categorize it into themes: What Went Well, What Needs Improvement, Action Items, and Team Sentiment.',
        outputFormat: 'json'
      },
      {
        id: 'identify-patterns',
        name: 'Pattern Analysis',
        description: 'Identify recurring patterns',
        prompt: 'Identify recurring patterns, systemic issues, and trends from the feedback. Compare with previous retrospectives if available.',
        outputFormat: 'json'
      },
      {
        id: 'prioritize-actions',
        name: 'Prioritize Actions',
        description: 'Prioritize improvement actions',
        prompt: 'Prioritize improvement actions based on impact, effort, and team sentiment. Recommend top 3-5 actions for the next sprint.',
        outputFormat: 'json'
      },
      {
        id: 'create-report',
        name: 'Generate Report',
        description: 'Create retrospective report',
        prompt: 'Create a comprehensive retrospective report with: summary, key themes, team sentiment, prioritized actions, and success metrics to track.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'user-story-workshop',
    name: 'User Story Workshop',
    description: 'Decompose epics into well-formed user stories with acceptance criteria',
    icon: 'list',
    category: 'planning',
    outputType: 'document',
    estimatedTime: '2-3 minutes',
    steps: [
      {
        id: 'analyze-epic',
        name: 'Analyze Epic',
        description: 'Understand epic scope and goals',
        prompt: 'Analyze the epic or feature from the documents. Extract the business goal, user needs, and success criteria.',
        outputFormat: 'json'
      },
      {
        id: 'identify-personas',
        name: 'Identify Personas',
        description: 'Identify user personas and roles',
        prompt: 'Identify all user personas, roles, and stakeholders who will interact with this feature.',
        outputFormat: 'json'
      },
      {
        id: 'decompose-stories',
        name: 'Decompose Stories',
        description: 'Break down into user stories',
        prompt: 'Decompose the epic into small, independently deliverable user stories following the INVEST criteria. Include story points estimation.',
        outputFormat: 'json'
      },
      {
        id: 'create-acceptance-criteria',
        name: 'Acceptance Criteria',
        description: 'Define acceptance criteria',
        prompt: 'For each user story, create clear, testable acceptance criteria using Given-When-Then format where appropriate.',
        outputFormat: 'json'
      },
      {
        id: 'create-workshop-doc',
        name: 'Generate Document',
        description: 'Create workshop document',
        prompt: 'Create a user story workshop document with: epic overview, persona descriptions, all user stories with acceptance criteria, dependencies, and prioritization recommendations.',
        outputFormat: 'markdown'
      }
    ]
  },
  {
    id: 'risk-dependency-analysis',
    name: 'Risk & Dependency Analysis',
    description: 'Identify and analyze risks, dependencies, and mitigation strategies',
    icon: 'alert-triangle',
    category: 'analysis',
    outputType: 'report',
    estimatedTime: '1-2 minutes',
    steps: [
      {
        id: 'identify-risks',
        name: 'Identify Risks',
        description: 'Extract all risks from documents',
        prompt: 'Identify all risks mentioned in the documents. Categorize by type: technical, resource, schedule, scope, external.',
        outputFormat: 'json'
      },
      {
        id: 'assess-impact',
        name: 'Impact Assessment',
        description: 'Assess risk probability and impact',
        prompt: 'For each risk, assess probability (Low/Medium/High) and impact (Low/Medium/High). Calculate overall risk score.',
        outputFormat: 'json'
      },
      {
        id: 'map-dependencies',
        name: 'Map Dependencies',
        description: 'Identify all dependencies',
        prompt: 'Identify all dependencies: team dependencies, technical dependencies, external dependencies. Map the dependency chain.',
        outputFormat: 'json'
      },
      {
        id: 'mitigation-strategies',
        name: 'Mitigation Strategies',
        description: 'Develop mitigation strategies',
        prompt: 'For each high-priority risk, develop specific mitigation strategies, contingency plans, and monitoring approaches.',
        outputFormat: 'json'
      },
      {
        id: 'create-analysis',
        name: 'Generate Analysis',
        description: 'Create risk analysis report',
        prompt: 'Create a comprehensive risk and dependency analysis report with: risk register, dependency map, mitigation plan, and monitoring recommendations.',
        outputFormat: 'markdown'
      }
    ]
  }
]

export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find(w => w.id === id)
}

export function getWorkflowsByCategory(category: string): WorkflowDefinition[] {
  return WORKFLOWS.filter(w => w.category === category)
}
