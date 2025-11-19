
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/login")
  }

  const isActive = session.user?.subscriptionStatus === 'ACTIVE'
  const isAdmin = session.user?.isAdmin

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Manage your Atlas Maximus subscription
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Plan</CardTitle>
                <CardDescription className="text-base mt-2">
                  {session.user?.email}
                </CardDescription>
              </div>
              <Badge 
                className={`text-base px-4 py-2 ${
                  isAdmin ? 'bg-purple-600' : 
                  isActive ? 'bg-green-600' : 
                  'bg-gray-600'
                }`}
              >
                {isAdmin ? (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Admin
                  </>
                ) : isActive ? (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Pro Member
                  </>
                ) : (
                  'Free'
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Get expert Agile guidance with Atlas Maximus
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Document Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload and analyze your Agile documents
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Voice Interaction</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Natural voice conversations with Atlas
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <p className="text-sm text-purple-900 font-medium">
                    You have admin access with unlimited features
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        {!isAdmin && !isActive && (
          <div className="text-center">
            <Card className="max-w-md mx-auto border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <div className="flex justify-center mb-4">
                  <Star className="h-12 w-12" />
                </div>
                <CardTitle className="text-3xl">Pro Plan</CardTitle>
                <CardDescription className="text-blue-100 text-base mt-2">
                  Full access to Atlas Maximus
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-900">$10</div>
                  <div className="text-gray-600 mt-2">per month</div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    Unlimited chat conversations
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    Document upload & analysis
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    Voice interaction
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    Template generation
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    Community knowledge sharing
                  </li>
                </ul>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  size="lg"
                  asChild
                >
                  <Link href="/api/stripe/create-checkout">
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              ← Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
