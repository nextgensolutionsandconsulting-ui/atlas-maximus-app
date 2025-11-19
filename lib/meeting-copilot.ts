
import { MeetingType } from '@prisma/client';

export interface AgendaItem {
  title: string;
  duration: number; // minutes
  description: string;
  presenter?: string;
  notes?: string;
}

export interface MeetingContext {
  sprintName?: string;
  sprintGoal?: string;
  piObjective?: string;
  teamVelocity?: number;
  completedStories?: number;
  totalStories?: number;
  impediments?: string[];
  upcomingDeadlines?: string[];
}

/**
 * Generate a meeting agenda based on meeting type and context
 */
export async function generateMeetingAgenda(
  meetingType: MeetingType,
  context: MeetingContext = {},
  customNotes?: string
): Promise<AgendaItem[]> {
  const agendas: Record<MeetingType, () => AgendaItem[]> = {
    SPRINT_PLANNING: () => generateSprintPlanningAgenda(context),
    DAILY_STANDUP: () => generateDailyStandupAgenda(context),
    SPRINT_REVIEW: () => generateSprintReviewAgenda(context),
    SPRINT_RETROSPECTIVE: () => generateRetrospectiveAgenda(context),
    PI_PLANNING: () => generatePIPlanningAgenda(context),
    BACKLOG_REFINEMENT: () => generateBacklogRefinementAgenda(context),
    TEAM_SYNC: () => generateTeamSyncAgenda(context),
    STAKEHOLDER_DEMO: () => generateStakeholderDemoAgenda(context),
    ARCHITECTURE_REVIEW: () => generateArchitectureReviewAgenda(context),
    IMPEDIMENT_REMOVAL: () => generateImpedimentRemovalAgenda(context),
    ONE_ON_ONE: () => generateOneOnOneAgenda(context),
    OTHER: () => generateGenericAgenda(context),
  };

  const baseAgenda = agendas[meetingType]?.() || generateGenericAgenda(context);
  
  return baseAgenda;
}

function generateSprintPlanningAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Sprint Goal Discussion',
      duration: 15,
      description: 'Define and align on the sprint goal based on product priorities and team capacity.',
      presenter: 'Product Owner',
    },
    {
      title: 'Team Capacity Review',
      duration: 10,
      description: `Review team availability and capacity. ${context.teamVelocity ? `Historical velocity: ${context.teamVelocity} points` : 'Discuss team availability'}`,
    },
    {
      title: 'Story Selection & Breakdown',
      duration: 45,
      description: 'Review and select user stories from the backlog. Break down stories into tasks.',
      presenter: 'Team',
    },
    {
      title: 'Task Estimation',
      duration: 30,
      description: 'Estimate effort for selected stories using story points or hours.',
    },
    {
      title: 'Dependency Identification',
      duration: 15,
      description: 'Identify and discuss any dependencies or risks for the sprint.',
    },
    {
      title: 'Sprint Commitment',
      duration: 5,
      description: 'Team commits to the sprint goal and selected stories.',
    },
  ];
}

function generateDailyStandupAgenda(context: MeetingContext): AgendaItem[] {
  const baseItems: AgendaItem[] = [
    {
      title: 'Quick Check-in',
      duration: 1,
      description: 'Brief greeting and attendance confirmation.',
    },
  ];

  // Add team member updates (assuming 5 members, 3 min each)
  for (let i = 1; i <= 5; i++) {
    baseItems.push({
      title: `Team Member ${i} Update`,
      duration: 3,
      description: '1) What did you complete yesterday? 2) What will you work on today? 3) Any blockers?',
    });
  }

  if (context.impediments && context.impediments.length > 0) {
    baseItems.push({
      title: 'Impediment Discussion',
      duration: 5,
      description: `Review and address blockers: ${context.impediments.join(', ')}`,
    });
  }

  baseItems.push({
    title: 'Sprint Progress Check',
    duration: 2,
    description: context.completedStories && context.totalStories
      ? `Sprint progress: ${context.completedStories}/${context.totalStories} stories completed`
      : 'Quick review of sprint burndown and remaining work.',
  });

  return baseItems;
}

function generateSprintReviewAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Sprint Overview',
      duration: 5,
      description: `Review sprint goal and overall achievements. ${context.sprintGoal ? `Goal: ${context.sprintGoal}` : ''}`,
      presenter: 'Scrum Master',
    },
    {
      title: 'Demo Completed Stories',
      duration: 40,
      description: 'Demonstrate completed user stories and features to stakeholders.',
      presenter: 'Development Team',
    },
    {
      title: 'Stakeholder Feedback',
      duration: 20,
      description: 'Collect feedback from stakeholders on demonstrated features.',
    },
    {
      title: 'Sprint Metrics Review',
      duration: 10,
      description: context.completedStories && context.totalStories
        ? `Review sprint metrics: ${context.completedStories}/${context.totalStories} stories completed, velocity: ${context.teamVelocity || 'TBD'}`
        : 'Review sprint burndown, velocity, and other key metrics.',
    },
    {
      title: 'Next Steps & Backlog Updates',
      duration: 5,
      description: 'Discuss product backlog updates and priorities for next sprint.',
      presenter: 'Product Owner',
    },
  ];
}

function generateRetrospectiveAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Set the Stage',
      duration: 5,
      description: 'Welcome and create a safe environment for open discussion.',
      presenter: 'Scrum Master',
    },
    {
      title: 'Gather Data - What Went Well',
      duration: 15,
      description: 'Team members share what went well during the sprint.',
    },
    {
      title: 'Gather Data - What Could Be Improved',
      duration: 15,
      description: 'Team members share challenges and areas for improvement.',
    },
    {
      title: 'Generate Insights',
      duration: 20,
      description: 'Discuss themes and patterns. Identify root causes of issues.',
    },
    {
      title: 'Decide What To Do',
      duration: 15,
      description: 'Select 2-3 concrete improvement actions for the next sprint.',
    },
    {
      title: 'Close the Retrospective',
      duration: 5,
      description: 'Summarize action items and thank the team for their participation.',
    },
  ];
}

function generatePIPlanningAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Business Context',
      duration: 30,
      description: `Review business objectives and vision. ${context.piObjective ? `PI Objective: ${context.piObjective}` : ''}`,
      presenter: 'Business Leadership',
    },
    {
      title: 'Product/Solution Vision',
      duration: 30,
      description: 'Present top 10 features for the upcoming PI.',
      presenter: 'Product Management',
    },
    {
      title: 'Architecture Vision & Development Practices',
      duration: 30,
      description: 'Review architectural changes and development practices.',
      presenter: 'System Architect',
    },
    {
      title: 'Planning Context',
      duration: 30,
      description: 'Review team capacity, velocity, and any constraints.',
    },
    {
      title: 'Team Breakouts - Iteration 1 & 2 Planning',
      duration: 120,
      description: 'Teams plan their work for the first two iterations.',
    },
    {
      title: 'Draft Plan Review',
      duration: 60,
      description: 'Teams present their draft plans and identify dependencies.',
    },
    {
      title: 'Management Review & Problem Solving',
      duration: 60,
      description: 'Address risks, dependencies, and resource allocation.',
    },
    {
      title: 'Plan Rework',
      duration: 60,
      description: 'Teams adjust plans based on feedback.',
    },
    {
      title: 'Final Plan Review & Confidence Vote',
      duration: 30,
      description: 'Final presentation and team confidence vote on PI objectives.',
    },
  ];
}

function generateBacklogRefinementAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Review Upcoming Stories',
      duration: 20,
      description: 'Review top priority stories from the backlog.',
      presenter: 'Product Owner',
    },
    {
      title: 'Clarify Requirements',
      duration: 25,
      description: 'Discuss acceptance criteria and technical requirements for each story.',
    },
    {
      title: 'Story Sizing',
      duration: 20,
      description: 'Estimate story points for refined stories.',
    },
    {
      title: 'Identify Dependencies',
      duration: 10,
      description: 'Flag any dependencies or technical challenges.',
    },
    {
      title: 'Backlog Prioritization',
      duration: 5,
      description: 'Confirm priority order of refined stories.',
      presenter: 'Product Owner',
    },
  ];
}

function generateTeamSyncAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Team Updates',
      duration: 15,
      description: 'Quick updates from each team member on current work.',
    },
    {
      title: 'Discuss Blockers',
      duration: 15,
      description: context.impediments && context.impediments.length > 0
        ? `Address current blockers: ${context.impediments.join(', ')}`
        : 'Identify and discuss any current blockers or challenges.',
    },
    {
      title: 'Collaboration Opportunities',
      duration: 15,
      description: 'Identify areas where team members can collaborate or help each other.',
    },
    {
      title: 'Upcoming Work Preview',
      duration: 10,
      description: 'Preview upcoming work and priorities.',
    },
    {
      title: 'Open Discussion',
      duration: 5,
      description: 'Open floor for any other topics or concerns.',
    },
  ];
}

function generateStakeholderDemoAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Introduction & Context',
      duration: 5,
      description: 'Welcome stakeholders and provide context for the demo.',
      presenter: 'Product Owner',
    },
    {
      title: 'Feature Demonstrations',
      duration: 40,
      description: 'Demo completed features and functionality.',
      presenter: 'Development Team',
    },
    {
      title: 'Q&A Session',
      duration: 20,
      description: 'Answer stakeholder questions about the demonstrated features.',
    },
    {
      title: 'Feedback Collection',
      duration: 15,
      description: 'Collect stakeholder feedback and suggestions.',
    },
    {
      title: 'Next Steps',
      duration: 5,
      description: 'Discuss upcoming priorities and next demo date.',
    },
  ];
}

function generateArchitectureReviewAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Architecture Overview',
      duration: 15,
      description: 'Present current architecture and proposed changes.',
      presenter: 'Architect',
    },
    {
      title: 'Technical Design Discussion',
      duration: 30,
      description: 'Deep dive into technical design decisions and trade-offs.',
    },
    {
      title: 'Security & Compliance Review',
      duration: 15,
      description: 'Review security implications and compliance requirements.',
    },
    {
      title: 'Scalability & Performance',
      duration: 15,
      description: 'Discuss scalability considerations and performance implications.',
    },
    {
      title: 'Technical Debt Assessment',
      duration: 10,
      description: 'Identify any technical debt introduced or resolved.',
    },
    {
      title: 'Decision & Action Items',
      duration: 5,
      description: 'Finalize decisions and assign follow-up action items.',
    },
  ];
}

function generateImpedimentRemovalAgenda(context: MeetingContext): AgendaItem[] {
  const items: AgendaItem[] = [
    {
      title: 'Review Current Impediments',
      duration: 10,
      description: context.impediments && context.impediments.length > 0
        ? `Current blockers: ${context.impediments.join(', ')}`
        : 'Review all current team impediments and blockers.',
    },
  ];

  if (context.impediments && context.impediments.length > 0) {
    context.impediments.forEach((impediment, index) => {
      items.push({
        title: `Impediment ${index + 1}: ${impediment.substring(0, 30)}...`,
        duration: 10,
        description: `Discuss root cause and potential solutions for: ${impediment}`,
      });
    });
  }

  items.push({
    title: 'Action Planning',
    duration: 15,
    description: 'Define specific actions, owners, and timelines for each impediment.',
  });

  items.push({
    title: 'Escalation Path',
    duration: 5,
    description: 'Identify any impediments that need escalation to management.',
  });

  return items;
}

function generateOneOnOneAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Check-in & Wellbeing',
      duration: 5,
      description: 'How are you doing? Any personal updates or concerns?',
    },
    {
      title: 'Recent Work Review',
      duration: 10,
      description: 'Discuss recent accomplishments and current projects.',
    },
    {
      title: 'Challenges & Support',
      duration: 10,
      description: 'What challenges are you facing? How can I support you?',
    },
    {
      title: 'Career Development',
      duration: 10,
      description: 'Discuss career goals, learning opportunities, and growth areas.',
    },
    {
      title: 'Feedback Exchange',
      duration: 10,
      description: 'Share feedback (both directions).',
    },
    {
      title: 'Action Items & Follow-up',
      duration: 5,
      description: 'Summarize action items and schedule next meeting.',
    },
  ];
}

function generateGenericAgenda(context: MeetingContext): AgendaItem[] {
  return [
    {
      title: 'Welcome & Introductions',
      duration: 5,
      description: 'Welcome participants and review meeting objectives.',
    },
    {
      title: 'Main Discussion',
      duration: 40,
      description: 'Core meeting content and discussions.',
    },
    {
      title: 'Q&A',
      duration: 10,
      description: 'Questions and clarifications.',
    },
    {
      title: 'Action Items & Next Steps',
      duration: 5,
      description: 'Summarize decisions and assign action items.',
    },
  ];
}

/**
 * Generate post-meeting notes summary
 */
export function generateMeetingNotes(
  meetingType: MeetingType,
  transcripts: Array<{ speaker?: string | null; content: string; timestamp: Date }>,
  actionItems?: any[],
  decisions?: any[]
): string {
  let notes = `# ${meetingType.replace(/_/g, ' ')} - Meeting Notes\n\n`;
  notes += `**Date:** ${new Date().toLocaleDateString()}\n\n`;

  // Key Decisions
  if (decisions && decisions.length > 0) {
    notes += `## Key Decisions\n\n`;
    decisions.forEach((decision, index) => {
      notes += `${index + 1}. ${decision.description || decision.title || 'Decision recorded'}\n`;
    });
    notes += `\n`;
  }

  // Action Items
  if (actionItems && actionItems.length > 0) {
    notes += `## Action Items\n\n`;
    actionItems.forEach((item, index) => {
      notes += `${index + 1}. ${item.description || item.title || 'Action item'} `;
      if (item.owner) notes += `(Owner: ${item.owner}) `;
      if (item.dueDate) notes += `(Due: ${item.dueDate}) `;
      notes += `\n`;
    });
    notes += `\n`;
  }

  // Meeting Transcript Summary
  if (transcripts && transcripts.length > 0) {
    notes += `## Discussion Summary\n\n`;
    transcripts.forEach((transcript) => {
      const speaker = transcript.speaker || 'Participant';
      notes += `**${speaker}:** ${transcript.content}\n\n`;
    });
  }

  notes += `## Next Steps\n\n`;
  notes += `- Review and complete action items\n`;
  notes += `- Follow up on key decisions\n`;
  notes += `- Schedule follow-up meetings as needed\n`;

  return notes;
}
