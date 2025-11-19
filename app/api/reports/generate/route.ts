
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generatePIBriefPPT,
  generateSprintHealthPPT,
  generateRiskSummaryPPT,
  generateDependencyHeatmapPPT,
} from "@/lib/generators/ppt-generator";
import {
  generatePIBriefDoc,
  generateSprintHealthDoc,
  generateRiskSummaryDoc,
  generateDependencyHeatmapDoc,
} from "@/lib/generators/word-generator";
import {
  analyzeJiraDataForPIBrief,
  analyzeJiraDataForSprintHealth,
  analyzeJiraDataForRisks,
  analyzeJiraDataForDependencies,
} from "@/lib/generators/data-analyzer";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reportType, datasetId, format, customData } = body;

    if (!reportType) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    // Verify dataset ownership if datasetId provided
    if (datasetId) {
      const dataset = await prisma.jiraDataset.findFirst({
        where: {
          id: datasetId,
          userId: session.user.id,
        },
      });

      if (!dataset) {
        return NextResponse.json(
          { error: "Dataset not found or access denied" },
          { status: 404 }
        );
      }
    }

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (reportType) {
      case "pi-brief": {
        const data = customData || (datasetId 
          ? await analyzeJiraDataForPIBrief(datasetId)
          : getDefaultPIBriefData());
        
        const piData = {
          programIncrement: customData?.programIncrement || "2024.Q4",
          objectives: data.objectives,
          risks: data.risks,
          confidence: data.confidence,
          teams: data.teams,
        };

        if (format === "docx") {
          buffer = await generatePIBriefDoc(piData);
          filename = `PI_Brief_${new Date().toISOString().split("T")[0]}.docx`;
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
          buffer = await generatePIBriefPPT(piData);
          filename = `PI_Brief_${new Date().toISOString().split("T")[0]}.pptx`;
          mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        break;
      }

      case "sprint-health": {
        const data = customData || (datasetId
          ? await analyzeJiraDataForSprintHealth(datasetId)
          : getDefaultSprintHealthData());

        const sprintData = {
          sprintName: customData?.sprintName || "Sprint 10",
          startDate: customData?.startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          endDate: customData?.endDate || new Date().toLocaleDateString(),
          totalStories: data.totalStories,
          completedStories: data.completedStories,
          inProgressStories: data.inProgressStories,
          blockedStories: data.blockedStories,
          velocity: data.velocity,
          burndown: data.burndown || [],
          teamMembers: data.teamMembers || [],
        };

        if (format === "docx") {
          buffer = await generateSprintHealthDoc(sprintData);
          filename = `Sprint_Health_${new Date().toISOString().split("T")[0]}.docx`;
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
          buffer = await generateSprintHealthPPT(sprintData);
          filename = `Sprint_Health_${new Date().toISOString().split("T")[0]}.pptx`;
          mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        break;
      }

      case "risk-summary": {
        const risks = customData?.risks || (datasetId
          ? await analyzeJiraDataForRisks(datasetId)
          : getDefaultRisks());

        const riskData = {
          title: customData?.title || "Program Risk Summary",
          date: new Date().toLocaleDateString(),
          risks,
        };

        if (format === "docx") {
          buffer = await generateRiskSummaryDoc(riskData);
          filename = `Risk_Summary_${new Date().toISOString().split("T")[0]}.docx`;
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
          buffer = await generateRiskSummaryPPT(riskData);
          filename = `Risk_Summary_${new Date().toISOString().split("T")[0]}.pptx`;
          mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        break;
      }

      case "dependency-heatmap": {
        const depData = customData || (datasetId
          ? await analyzeJiraDataForDependencies(datasetId)
          : getDefaultDependencyData());

        const heatmapData = {
          title: customData?.title || "Team Dependency Heatmap",
          teams: depData.teams,
          dependencies: depData.dependencies,
        };

        if (format === "docx") {
          buffer = await generateDependencyHeatmapDoc(heatmapData);
          filename = `Dependency_Heatmap_${new Date().toISOString().split("T")[0]}.docx`;
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
          buffer = await generateDependencyHeatmapPPT(heatmapData);
          filename = `Dependency_Heatmap_${new Date().toISOString().split("T")[0]}.pptx`;
          mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Return the file as a downloadable response
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function getDefaultPIBriefData() {
  return {
    objectives: [
      {
        id: "OBJ-1",
        description: "Complete user authentication and authorization",
        businessValue: 8,
        status: "Committed",
      },
      {
        id: "OBJ-2",
        description: "Implement core dashboard features",
        businessValue: 10,
        status: "Committed",
      },
      {
        id: "OBJ-3",
        description: "Integrate third-party payment gateway",
        businessValue: 7,
        status: "Uncommitted",
      },
    ],
    risks: [
      {
        description: "Dependency on external API availability",
        severity: "medium" as "high" | "medium" | "low",
        mitigation: "Implement fallback mechanisms and caching",
      },
      {
        description: "Resource constraints due to holidays",
        severity: "low" as "high" | "medium" | "low",
        mitigation: "Adjusted sprint planning and buffer time",
      },
    ],
    confidence: {
      committed: 75,
      uncommitted: 25,
      overall: 75,
    },
    teams: [
      { name: "Team Alpha", capacity: 50, velocity: 42 },
      { name: "Team Beta", capacity: 45, velocity: 38 },
    ],
  };
}

function getDefaultSprintHealthData() {
  return {
    totalStories: 25,
    completedStories: 18,
    inProgressStories: 5,
    blockedStories: 2,
    velocity: 42,
    burndown: [
      { day: "Day 1", remaining: 25, ideal: 25 },
      { day: "Day 2", remaining: 23, ideal: 22 },
      { day: "Day 3", remaining: 21, ideal: 20 },
      { day: "Day 4", remaining: 19, ideal: 17 },
      { day: "Day 5", remaining: 16, ideal: 15 },
      { day: "Day 6", remaining: 14, ideal: 12 },
      { day: "Day 7", remaining: 11, ideal: 10 },
      { day: "Day 8", remaining: 9, ideal: 7 },
      { day: "Day 9", remaining: 7, ideal: 5 },
      { day: "Day 10", remaining: 7, ideal: 2 },
    ],
    teamMembers: [
      { name: "Alice Johnson", completedPoints: 13, totalPoints: 15 },
      { name: "Bob Smith", completedPoints: 11, totalPoints: 13 },
      { name: "Carol Davis", completedPoints: 8, totalPoints: 10 },
      { name: "David Wilson", completedPoints: 10, totalPoints: 12 },
    ],
  };
}

function getDefaultRisks() {
  return [
    {
      id: "RISK-1",
      description: "API integration delays due to third-party vendor issues",
      category: "Technical",
      severity: "high" as "critical" | "high" | "medium" | "low",
      probability: 70,
      impact: "2-week delay in feature delivery",
      owner: "Tech Lead",
      mitigation: "Daily sync with vendor, backup API identified",
      status: "Active",
    },
    {
      id: "RISK-2",
      description: "Key team member on extended leave",
      category: "Resource",
      severity: "medium" as "critical" | "high" | "medium" | "low",
      probability: 90,
      impact: "Reduced team velocity by 15%",
      owner: "Scrum Master",
      mitigation: "Knowledge transfer completed, pair programming implemented",
      status: "Mitigated",
    },
    {
      id: "RISK-3",
      description: "Scope creep from stakeholder requests",
      category: "Scope",
      severity: "medium" as "critical" | "high" | "medium" | "low",
      probability: 60,
      impact: "Sprint goals at risk",
      owner: "Product Owner",
      mitigation: "Change control process, weekly backlog refinement",
      status: "Active",
    },
  ];
}

function getDefaultDependencyData() {
  return {
    teams: ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"],
    dependencies: [
      {
        fromTeam: "Team Alpha",
        toTeam: "Team Beta",
        count: 5,
        description: "API contracts and data models",
      },
      {
        fromTeam: "Team Beta",
        toTeam: "Team Gamma",
        count: 3,
        description: "UI component library",
      },
      {
        fromTeam: "Team Gamma",
        toTeam: "Team Delta",
        count: 2,
        description: "Testing infrastructure",
      },
      {
        fromTeam: "Team Alpha",
        toTeam: "Team Gamma",
        count: 4,
        description: "Shared authentication service",
      },
    ],
  };
}
