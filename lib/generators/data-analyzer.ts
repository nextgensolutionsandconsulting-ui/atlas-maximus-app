
import { prisma } from "@/lib/db";

export async function analyzeJiraDataForPIBrief(datasetId: string) {
  const issues = await prisma.jiraIssue.findMany({
    where: { datasetId },
  });

  // Extract objectives from epics
  const objectives = issues
    .filter((i) => i.issueType?.toLowerCase() === "epic" || i.labels?.includes("objective"))
    .map((issue, index) => ({
      id: issue.issueKey || `OBJ-${index + 1}`,
      description: issue.summary || "No description",
      businessValue: issue.storyPoints || Math.floor(Math.random() * 10) + 1,
      status: issue.status?.toLowerCase().includes("done") || issue.status?.toLowerCase().includes("complete")
        ? "Committed"
        : "Uncommitted",
    }));

  // Analyze risks based on blocked items and high priority issues
  const risks = [];
  const blockedIssues = issues.filter((i) => 
    i.status?.toLowerCase().includes("blocked") || 
    i.labels?.includes("blocked")
  );
  
  if (blockedIssues.length > 0) {
    risks.push({
      description: `${blockedIssues.length} blocked items affecting delivery`,
      severity: blockedIssues.length > 5 ? "high" : "medium" as "high" | "medium" | "low",
      mitigation: "Daily stand-ups to address blockers, escalation path established",
    });
  }

  const highPriorityOpen = issues.filter(
    (i) => i.priority?.toLowerCase().includes("high") && !i.status?.toLowerCase().includes("done")
  );
  
  if (highPriorityOpen.length > 0) {
    risks.push({
      description: `${highPriorityOpen.length} high-priority items not completed`,
      severity: highPriorityOpen.length > 10 ? "high" : "medium" as "high" | "medium" | "low",
      mitigation: "Resource reallocation, pair programming on critical items",
    });
  }

  // Default risk if none identified
  if (risks.length === 0) {
    risks.push({
      description: "Scope creep during PI execution",
      severity: "medium" as "high" | "medium" | "low",
      mitigation: "Change control process, weekly scope reviews",
    });
  }

  // Calculate confidence based on completion rates
  const completedCount = issues.filter((i) => 
    i.status?.toLowerCase().includes("done") || 
    i.status?.toLowerCase().includes("complete")
  ).length;
  const totalCount = issues.length || 1;
  const completionRate = Math.round((completedCount / totalCount) * 100);
  
  const confidence = {
    committed: completionRate,
    uncommitted: 100 - completionRate,
    overall: completionRate,
  };

  // Extract team information
  const teamMap = new Map<string, { stories: number; points: number }>();
  issues.forEach((issue) => {
    const team = issue.team || issue.assignee || "Unassigned";
    if (!teamMap.has(team)) {
      teamMap.set(team, { stories: 0, points: 0 });
    }
    const teamData = teamMap.get(team)!;
    teamData.stories += 1;
    teamData.points += issue.storyPoints || 0;
  });

  const teams = Array.from(teamMap.entries()).map(([name, data]) => ({
    name,
    capacity: Math.round(data.points * 1.2), // 20% buffer
    velocity: data.points,
  }));

  return {
    objectives: objectives.length > 0 ? objectives : [
      {
        id: "OBJ-1",
        description: "Complete core feature development",
        businessValue: 8,
        status: "Committed",
      },
    ],
    risks,
    confidence,
    teams: teams.length > 0 ? teams : [
      { name: "Team Alpha", capacity: 50, velocity: 42 },
    ],
  };
}

export async function analyzeJiraDataForSprintHealth(datasetId: string) {
  const issues = await prisma.jiraIssue.findMany({
    where: { datasetId },
  });

  const totalStories = issues.filter((i) => 
    i.issueType?.toLowerCase() === "story" || 
    i.issueType?.toLowerCase() === "task"
  ).length;

  const completedStories = issues.filter((i) => 
    i.status?.toLowerCase().includes("done") || 
    i.status?.toLowerCase().includes("complete")
  ).length;

  const inProgressStories = issues.filter((i) => 
    i.status?.toLowerCase().includes("progress")
  ).length;

  const blockedStories = issues.filter((i) => 
    i.status?.toLowerCase().includes("blocked")
  ).length;

  const velocity = issues
    .filter((i) => 
      i.status?.toLowerCase().includes("done") || 
      i.status?.toLowerCase().includes("complete")
    )
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  // Extract team member performance
  const memberMap = new Map<string, { completed: number; total: number }>();
  issues.forEach((issue) => {
    const member = issue.assignee || "Unassigned";
    if (!memberMap.has(member)) {
      memberMap.set(member, { completed: 0, total: 0 });
    }
    const memberData = memberMap.get(member)!;
    memberData.total += issue.storyPoints || 0;
    if (issue.status?.toLowerCase().includes("done") || issue.status?.toLowerCase().includes("complete")) {
      memberData.completed += issue.storyPoints || 0;
    }
  });

  const teamMembers = Array.from(memberMap.entries()).map(([name, data]) => ({
    name,
    completedPoints: data.completed,
    totalPoints: data.total,
  }));

  // Generate burndown data (simulated)
  const burndown = Array.from({ length: 10 }, (_, i) => ({
    day: `Day ${i + 1}`,
    remaining: Math.max(0, totalStories - Math.floor((completedStories / 10) * (i + 1))),
    ideal: Math.max(0, totalStories - Math.floor((totalStories / 10) * (i + 1))),
  }));

  return {
    totalStories,
    completedStories,
    inProgressStories,
    blockedStories,
    velocity,
    burndown,
    teamMembers,
  };
}

export async function analyzeJiraDataForRisks(datasetId: string) {
  const issues = await prisma.jiraIssue.findMany({
    where: { datasetId },
  });

  const risks: Array<{
    id: string;
    description: string;
    category: string;
    severity: "critical" | "high" | "medium" | "low";
    probability: number;
    impact: string;
    owner: string;
    mitigation: string;
    status: string;
  }> = [];

  // Identify blocked items as risks
  const blockedIssues = issues.filter((i) => 
    i.status?.toLowerCase().includes("blocked")
  );
  blockedIssues.forEach((issue, index) => {
    risks.push({
      id: `RISK-${risks.length + 1}`,
      description: `Blocked: ${issue.summary}`,
      category: "Blocker",
      severity: issue.priority?.toLowerCase().includes("high") ? "high" : "medium",
      probability: 90,
      impact: "Delays sprint delivery",
      owner: issue.assignee || "Unassigned",
      mitigation: "Escalate to remove blocker, pair with senior developer",
      status: "Active",
    });
  });

  // Identify overdue items
  const overdueIssues = issues.filter((i) => 
    i.dueDate && 
    new Date(i.dueDate) < new Date() && 
    !i.status?.toLowerCase().includes("done")
  );
  if (overdueIssues.length > 0) {
    risks.push({
      id: `RISK-${risks.length + 1}`,
      description: `${overdueIssues.length} overdue items affecting timeline`,
      category: "Schedule",
      severity: overdueIssues.length > 5 ? "high" : "medium",
      probability: 85,
      impact: "Sprint goals at risk",
      owner: "Scrum Master",
      mitigation: "Re-prioritize backlog, increase team capacity",
      status: "Active",
    });
  }

  // Identify high priority incomplete items
  const highPriorityOpen = issues.filter(
    (i) => i.priority?.toLowerCase().includes("high") && !i.status?.toLowerCase().includes("done")
  );
  if (highPriorityOpen.length > 5) {
    risks.push({
      id: `RISK-${risks.length + 1}`,
      description: `${highPriorityOpen.length} high-priority items not completed`,
      category: "Priority",
      severity: "high",
      probability: 75,
      impact: "Critical features delayed",
      owner: "Product Owner",
      mitigation: "Focus team on high-priority items, defer low-priority work",
      status: "Active",
    });
  }

  // Add general risks if none identified
  if (risks.length === 0) {
    risks.push({
      id: "RISK-1",
      description: "Low risk profile detected",
      category: "General",
      severity: "low",
      probability: 20,
      impact: "Minimal impact expected",
      owner: "Team Lead",
      mitigation: "Continue monitoring",
      status: "Monitoring",
    });
  }

  return risks;
}

export async function analyzeJiraDataForDependencies(datasetId: string) {
  const issues = await prisma.jiraIssue.findMany({
    where: { datasetId },
  });

  // Extract unique teams
  const teams = Array.from(
    new Set(issues.map((i) => i.team || i.assignee || "Unassigned"))
  );

  // Analyze dependencies based on linked issues (simulated)
  const dependencies: Array<{
    fromTeam: string;
    toTeam: string;
    count: number;
    description: string;
  }> = [];

  // Create a map to track dependencies
  const depMap = new Map<string, number>();

  issues.forEach((issue) => {
    const fromTeam = issue.team || issue.assignee || "Unassigned";
    
    // Simulate dependencies based on issue type and relationships
    if (issue.issueType?.toLowerCase() === "epic" || issue.labels?.includes("dependency")) {
      // Epic or dependency issues create dependencies
      teams.forEach((toTeam) => {
        if (fromTeam !== toTeam) {
          const key = `${fromTeam}->${toTeam}`;
          depMap.set(key, (depMap.get(key) || 0) + 1);
        }
      });
    }
  });

  // Convert map to array
  depMap.forEach((count, key) => {
    const [fromTeam, toTeam] = key.split("->");
    dependencies.push({
      fromTeam,
      toTeam,
      count,
      description: `${count} shared epic(s) or feature dependencies`,
    });
  });

  // Add some simulated dependencies if none found
  if (dependencies.length === 0 && teams.length > 1) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i !== j) {
          dependencies.push({
            fromTeam: teams[i],
            toTeam: teams[j],
            count: Math.floor(Math.random() * 3),
            description: "Cross-team collaboration",
          });
        }
      }
    }
  }

  return { teams, dependencies };
}
