
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, FileSpreadsheet, Presentation } from "lucide-react";
import { toast } from "sonner";

type ReportType = "pi-brief" | "sprint-health" | "risk-summary" | "dependency-heatmap";
type FormatType = "pptx" | "docx";

type Dataset = {
  id: string;
  name: string;
  description: string | null;
  issueCount: number;
  createdAt: string;
};

type AvailableReport = {
  type: ReportType;
  name: string;
  description: string;
  formats: FormatType[];
  icon: string;
};

export function ReportGenerator() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [availableReports, setAvailableReports] = useState<AvailableReport[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("sample");
  const [selectedReport, setSelectedReport] = useState<ReportType>("pi-brief");
  const [selectedFormat, setSelectedFormat] = useState<FormatType>("pptx");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/list");
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
        setAvailableReports(data.availableReports || []);
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error("Failed to load report options");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: selectedReport,
          datasetId: selectedDataset === "sample" ? null : selectedDataset,
          format: selectedFormat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const reportName = availableReports.find((r) => r.type === selectedReport)?.name || "Report";
      a.download = `${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${selectedFormat}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report generated successfully! Check your downloads.");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentReport = availableReports.find((r) => r.type === selectedReport);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Generate Executive Reports</CardTitle>
              <CardDescription>
                One-click generation of professional slides and documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select report type, data source, and format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableReports.map((report) => (
                    <SelectItem key={report.type} value={report.type}>
                      <div className="flex items-center gap-2">
                        <span>{report.icon}</span>
                        <span>{report.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Source Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Source</label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sample">
                    📝 Sample Data (Demo)
                  </SelectItem>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span>{dataset.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {dataset.issueCount} issues
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {datasets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upload Jira data in the Jira tab to use real data
                </p>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedFormat === "pptx" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSelectedFormat("pptx")}
                >
                  <Presentation className="mr-2 h-4 w-4" />
                  PowerPoint
                </Button>
                <Button
                  variant={selectedFormat === "docx" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSelectedFormat("docx")}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Word
                </Button>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>What you'll get in this report</CardDescription>
          </CardHeader>
          <CardContent>
            {currentReport && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{currentReport.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{currentReport.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentReport.description}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Included Content:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedReport === "pi-brief" && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>PI objectives with business value and status</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Team confidence vote visualization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Risk assessment with mitigation strategies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Team capacity and velocity metrics</span>
                        </li>
                      </>
                    )}
                    {selectedReport === "sprint-health" && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Sprint progress and completion metrics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Burndown chart and velocity tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Team member performance breakdown</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Blocked and in-progress story analysis</span>
                        </li>
                      </>
                    )}
                    {selectedReport === "risk-summary" && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Comprehensive risk inventory</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Severity levels and probability assessment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Impact analysis and mitigation plans</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Risk ownership and status tracking</span>
                        </li>
                      </>
                    )}
                    {selectedReport === "dependency-heatmap" && (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Cross-team dependency matrix</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Heat-mapped visualization of dependencies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Critical dependency identification</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>Detailed dependency descriptions</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <p className="text-sm font-medium text-primary mb-1">
                    ⚡ Time Savings
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This automated report saves you 4-6 hours of manual preparation time for executive reviews
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Reports Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Reports</CardTitle>
          <CardDescription>Quick access to all executive report types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {availableReports.map((report) => (
              <Card
                key={report.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedReport === report.type ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedReport(report.type)}
              >
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{report.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {report.formats.map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">
                        {format.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
