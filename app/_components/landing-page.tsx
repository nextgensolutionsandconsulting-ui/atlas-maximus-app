"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageCircle,
  Upload,
  Users,
  Zap,
  Star,
  ChevronRight,
  Workflow,
  FileText,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Mic,
  Share2,
  Target
} from "lucide-react"
import { AtlasLogo } from "@/components/ui/atlas-logo"
import Image from "next/image"
import Link from "next/link"

export function LandingPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <AtlasLogo width={40} height={40} alt="Atlas Maximus - Header Logo" />
              <h1 className="text-2xl font-bold text-gray-900">Atlas Maximus</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 flex justify-center drop-shadow-2xl">
            <AtlasLogo
              width={128}
              height={128}
              alt="Atlas Maximus - AI-Powered Agile Learning Avatar"
            />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered <span className="text-blue-600">Agile Coach</span> &{" "}
            <span className="text-purple-600">Program Companion</span>
          </h1>
          <p className="text-xl text-gray-700 mb-4 max-w-3xl mx-auto">
            Atlas Maximus delivers <strong>role-based coaching</strong>,{" "}
            <strong>predictive analytics</strong>, <strong>risk modeling</strong>, and{" "}
            <strong>executive-ready outputs</strong> — all powered by your real Agile data.
          </p>
          <p className="text-lg text-gray-600 italic mb-2 max-w-2xl mx-auto">
            "Built for Scrum Masters, Agile Coaches, RTEs, and Portfolio Leaders who demand insight,
            not noise."
          </p>
          <p className="text-2xl font-semibold text-blue-600 mb-8 max-w-2xl mx-auto">
            Plan smarter. Deliver faster. Lead with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Get Started with Atlas
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8">
                Try Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
            Atlas Maximus access is available exclusively through your NextGen Solutions &
            Consulting subscription.
          </p>
        </div>
      </section>

      {/* Core Value Pillars */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">Personalized Coaching</h3>
                <p className="text-gray-700 text-sm">Ask Atlas anything. Get role-specific answers.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">Predictive Insights</h3>
                <p className="text-gray-700 text-sm">
                  Forecast risk, confidence, and velocity with ML.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6 text-center">
                <div className="bg-green-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">Document Intelligence</h3>
                <p className="text-gray-700 text-sm">
                  Upload docs, get smart answers. Never lose tribal knowledge.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Memory & Recall</h3>
                <p className="text-gray-700 text-sm">
                  Recall any past coaching, conversation, or decision.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Atlas? Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Why Atlas Maximus?
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Stop settling for generic answers and siloed dashboards
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Other Tools */}
            <Card className="border-2 border-red-200 bg-red-50/30">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-red-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">😰</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Other Tools</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl font-bold">×</span>
                    <span className="text-gray-700">Generic LLM answers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl font-bold">×</span>
                    <span className="text-gray-700">No SAFe alignment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl font-bold">×</span>
                    <span className="text-gray-700">No coaching capability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl font-bold">×</span>
                    <span className="text-gray-700">Siloed dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl font-bold">×</span>
                    <span className="text-gray-700">Manual executive prep</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Atlas Maximus */}
            <Card className="border-2 border-green-200 bg-green-50/30 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Atlas Maximus</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                    <span className="text-gray-700">
                      <strong>Role-based coaching</strong> from a trained AI avatar
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                    <span className="text-gray-700">
                      <strong>Built-in SAFe + Scrum</strong> best practices
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                    <span className="text-gray-700">
                      <strong>Integrated risk</strong> + confidence models
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                    <span className="text-gray-700">
                      <strong>Real-time analytics</strong> + team heatmaps
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl font-bold">✓</span>
                    <span className="text-gray-700">
                      <strong>One-click PDF &amp; PPT</strong> readouts for leadership
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built For Agile Professionals</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're leading ceremonies, refining backlogs, or scaling practices, Atlas has
              you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-blue-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Scrum Masters</h3>
                <p className="text-gray-600 text-sm">
                  Improve cadence and ceremonies with instant retrospective reports, sprint planning
                  guidance, and team health checks
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-purple-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Product Owners</h3>
                <p className="text-gray-600 text-sm">
                  Refine backlogs and objectives with user story workshops, INVEST criteria checks,
                  and prioritization frameworks
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Agile Coaches</h3>
                <p className="text-gray-600 text-sm">
                  Scale consistent practices across teams with training decks, coaching templates,
                  and maturity assessments
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-orange-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <Workflow className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">RTEs &amp; STEs</h3>
                <p className="text-gray-600 text-sm">
                  Prepare for PI Planning and Inspect &amp; Adapt with program-level briefings,
                  dependency analysis, and risk reports
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-indigo-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Leadership</h3>
                <p className="text-gray-600 text-sm">
                  Get fast readouts and decision summaries with compliance risk assessments and
                  executive-ready reports
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="bg-cyan-100 rounded-lg p-3 w-12 h-12 mb-4 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Teams &amp; Developers</h3>
                <p className="text-gray-600 text-sm">
                  Learn Agile practices, get instant answers to methodology questions, and access
                  reference materials on-demand
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Atlas Maximus?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Talking Avatar</h3>
                <p className="text-gray-600 text-sm">
                  Interactive conversations with professional AI voice and visual feedback
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Document Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Upload PDFs, Word docs, and presentations for AI-powered analysis
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Role-Based Learning</h3>
                <p className="text-gray-600 text-sm">
                  Personalized guidance for your specific Agile role and experience level
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Workflow className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Structured Workflows</h3>
                <p className="text-gray-600 text-sm">
                  7 pre-built workflows for generating deliverables and training materials
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comprehensive Capabilities Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Master Agile
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Atlas Maximus combines AI-powered learning with practical workflows to help you excel
              in your Agile journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Workflows Card */}
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3">
                    <Workflow className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">7 Structured Workflows</h3>
                    <p className="text-gray-600">
                      Execute multi-step processes that produce tangible deliverables
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>PI Planning Briefing:</strong> Complete program increment planning
                      packages
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Compliance Risk Assessment:</strong> Risk scoring and mitigation
                      strategies
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Decision Summary:</strong> Structured decision documentation with RACI
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Training Deck Creation:</strong> Professional PowerPoint presentations
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Sprint Retrospective:</strong> Complete retro reports with action
                      items
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>User Story Workshop:</strong> Story writing and refinement guidance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Target className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Risk &amp; Dependency Analysis:</strong> Visual dependency maps and
                      mitigation plans
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Templates & Resources Card */}
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Downloadable Templates
                    </h3>
                    <p className="text-gray-600">
                      Get professional templates in multiple formats with clickable links
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Excel Templates:</strong> Sprint planning, velocity tracking, burndown
                      charts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>PowerPoint Decks:</strong> Training presentations, retrospective
                      formats
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Word Documents:</strong> Charter templates, definition of done, team
                      agreements
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>PDF Guides:</strong> Quick reference cards, process guides, checklists
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>On-Demand Generation:</strong> Atlas creates templates based on your
                      requests
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Community Learning Card */}
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg p-3">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Community Knowledge Sharing
                    </h3>
                    <p className="text-gray-600">
                      Learn from real experiences shared by other Agile practitioners
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Shared Experiences:</strong> Atlas learns from user contributions
                      across the community
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Real-World Solutions:</strong> Practical insights from practitioners
                      facing similar challenges
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Continuous Improvement:</strong> Atlas gets smarter with every
                      contribution
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Context-Aware Advice:</strong> Recommendations based on similar
                      situations
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Interactive Learning Card */}
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-3">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Interactive Voice &amp; Text Learning
                    </h3>
                    <p className="text-gray-600">
                      Choose your preferred learning style with voice or text
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Mic className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Natural Voice Responses:</strong> High-quality AI voice reads
                      responses aloud
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Mic className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Voice Input:</strong> Ask questions using your microphone
                    </span>
                  </li>
                  <li className="flex items-start">
                    <BookOpen className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Text Mode:</strong> Read responses at your own pace with markdown
                      formatting
                    </span>
                  </li>
                  <li className="flex items-start">
                    <MessageCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Conversational Interface:</strong> Natural back-and-forth dialogue
                    </span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Context Awareness:</strong> Atlas remembers your conversation history
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Additional Capabilities */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Additional Capabilities
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Document Intelligence</h4>
                <p className="text-sm text-gray-600">
                  Upload training docs, guides, and PDFs. Atlas extracts and learns from your
                  content.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Role-Specific Guidance</h4>
                <p className="text-sm text-gray-600">
                  Tailored advice for Scrum Masters, Product Owners, Developers, Testers, and
                  Coaches.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Instant Insights</h4>
                <p className="text-sm text-gray-600">
                  Real-time answers to Scrum, SAFe, and Agile questions with cited references.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables Showcase */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">See What Atlas Generates</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional, ready-to-use deliverables in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* PI Planning Briefing */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src="/pi-planning-deliverable.png"
                  alt="PI Planning Briefing Example"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">PI Planning Briefing</h3>
                <p className="text-gray-600 text-sm">
                  Complete program increment planning packages with objectives, dependencies, and
                  team capacity analysis
                </p>
              </CardContent>
            </Card>

            {/* Risk Assessment Heatmap */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src="/risk-assessment-deliverable.png"
                  alt="Risk Assessment Heatmap Example"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">Compliance Risk Assessment</h3>
                <p className="text-gray-600 text-sm">
                  Color-coded risk matrices with severity analysis and mitigation strategies for
                  regulatory compliance
                </p>
              </CardContent>
            </Card>

            {/* User Story Workshop */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src="/user-story-deliverable.png"
                  alt="User Story Workshop Training Deck Example"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">User Story Workshop</h3>
                <p className="text-gray-600 text-sm">
                  Professional training materials with INVEST criteria, story decomposition
                  frameworks, and workshop facilitation guides
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Credibility & Trust Signals */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise-Ready &amp; Trustworthy
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with security, compliance, and industry standards in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Industry Framework Aligned
                    </h3>
                    <p className="text-gray-600">
                      Atlas cites <strong>Scrum Guide (2020)</strong> and <strong>SAFe 6.0</strong>{" "}
                      sources, ensuring your coaching and training align with current industry
                      standards including ICAgile and Scrum Alliance frameworks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Private &amp; Secure</h3>
                    <p className="text-gray-600">
                      All document analysis runs privately on secure infrastructure.{" "}
                      <strong>Your files are never used to train AI</strong>, and your
                      organization's knowledge stays confidential.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Regulatory Compliant
                    </h3>
                    <p className="text-gray-600">
                      Used by teams in <strong>financial and regulatory environments</strong> where
                      compliance, audit trails, and documentation standards are critical.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="bg-orange-100 rounded-lg p-3 flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Proven Track Record</h3>
                    <p className="text-gray-600">
                      Trusted by <strong>Scrum Masters, RTEs, and Agile Coaches</strong> across
                      multiple industries to deliver consistent, high-quality coaching and training
                      materials.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Trusted by Agile Professionals
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Scrum Master",
                content:
                  "Atlas Maximus transformed how I approach sprint planning. The talking avatar makes learning engaging!"
              },
              {
                name: "Mike Rodriguez",
                role: "Product Owner",
                content:
                  "The document analysis feature helped me streamline our backlog refinement process significantly."
              },
              {
                name: "Lisa Thompson",
                role: "Agile Coach",
                content:
                  "Perfect for both beginners and experienced professionals. The role-based guidance is spot-on."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access / Subscription Info (replaces pricing section) */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Get Atlas Maximus</h2>
          <p className="text-lg text-gray-600 mb-6">
            Atlas Maximus is available exclusively as part of the NextGen Solutions &amp; Consulting
            platform.
          </p>
          <p className="text-base text-gray-600 mb-8">
            Purchase your subscription through NextGen, then use your credentials to sign in and
            start working with Atlas for Agile coaching, training, and program support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8">
                Existing Customer — Sign In
              </Button>
            </Link>
            <a
              href="https://your-nextgen-site-url.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                Learn More on NextGen
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <AtlasLogo width={32} height={32} alt="Atlas Maximus - Footer Logo" />
              <span className="text-xl font-bold">Atlas Maximus</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Atlas Maximus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
