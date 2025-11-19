
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Jira datasets for report generation
    const datasets = await prisma.jiraDataset.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      datasets: datasets.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        issueCount: d._count.issues,
        createdAt: d.createdAt,
      })),
      availableReports: [
        {
          type: "pi-brief",
          name: "PI Brief",
          description: "Program Increment objectives, risks, and confidence vote",
          formats: ["pptx", "docx"],
          icon: "📊",
        },
        {
          type: "sprint-health",
          name: "Sprint Health Report",
          description: "Sprint metrics, velocity, burndown, and team performance",
          formats: ["pptx", "docx"],
          icon: "🏃",
        },
        {
          type: "risk-summary",
          name: "Risk Summary",
          description: "Comprehensive risk analysis with severity and mitigation plans",
          formats: ["pptx", "docx"],
          icon: "⚠️",
        },
        {
          type: "dependency-heatmap",
          name: "Dependency Heatmap",
          description: "Cross-team dependency analysis and visualization",
          formats: ["pptx", "docx"],
          icon: "🔗",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}
