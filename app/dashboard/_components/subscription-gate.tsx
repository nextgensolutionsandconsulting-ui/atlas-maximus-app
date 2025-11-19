
"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, MessageCircle, Upload, Star, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export function SubscriptionGate() {
  const { data: session } = useSession() || {}
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    "Unlimited conversations with Atlas Maximus",
    "Professional talking avatar with TTS",
    "Upload and analyze documents",
    "Personalized Agile role guidance",
    "Access to knowledge base",
    "Conversation history & export",
    "Priority customer support"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="relative mx-auto h-24 w-24 mb-6">
            <Image
              src="https://cdn.abacus.ai/images/49540a17-dfde-4fe0-82a9-aa49da723866.png"
              alt="Atlas Maximus Avatar"
              fill
              className="rounded-full object-cover shadow-lg"
              priority
            />
            <div className="absolute -top-2 -right-2">
              <div className="bg-yellow-400 rounded-full p-2">
                <Crown className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unlock Atlas Maximus Pro
          </h1>
          <p className="text-gray-600">
            Welcome {session?.user?.name}! To access your personalized Agile learning companion, 
            please upgrade to our Pro subscription.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2">
                <Star className="h-4 w-4 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardTitle className="text-2xl text-gray-900">Atlas Maximus Pro</CardTitle>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="text-4xl font-bold text-gray-900">$10</span>
              <div className="text-left">
                <div className="text-sm text-gray-600">per month</div>
                <div className="text-xs text-gray-500">Cancel anytime</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="space-y-3">
              {features?.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Role-Specific Benefits */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Personalized for {session?.user?.agileRole?.replace(/_/g, ' ') || 'Your Role'}
              </h4>
              <p className="text-sm text-blue-700">
                Get tailored guidance, scenarios, and best practices specific to your Agile role and experience level.
              </p>
            </div>

            {/* Quick Preview Features */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">AI Chat</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">File Analysis</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium">TTS Avatar</p>
              </div>
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
            >
              {isLoading ? (
                "Creating subscription..."
              ) : (
                <>
                  Start Your Pro Subscription
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Secure payment processed by Stripe. Cancel anytime in your account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
