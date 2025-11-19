
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Save, 
  Volume2, 
  Settings, 
  Crown,
  Calendar,
  Mail,
  Users,
  Loader2,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export const agileRoles = [
  { value: "SCRUM_MASTER", label: "Scrum Master" },
  { value: "PRODUCT_OWNER", label: "Product Owner" },
  { value: "DEVELOPER", label: "Developer" },
  { value: "TESTER", label: "Tester" },
  { value: "AGILE_COACH", label: "Agile Coach" },
  { value: "RELEASE_TRAIN_ENGINEER", label: "Release Train Engineer" },
  { value: "SOLUTION_TRAIN_ENGINEER", label: "Solution Train Engineer" },
]

const experienceLevels = [
  { 
    value: "BEGINNER", 
    label: "Beginner", 
    description: "New to Agile, learning fundamentals",
    icon: "🌱"
  },
  { 
    value: "INTERMEDIATE", 
    label: "Intermediate", 
    description: "1-3 years, comfortable with basics",
    icon: "📚"
  },
  { 
    value: "ADVANCED", 
    label: "Advanced", 
    description: "3-5 years, leading teams/initiatives",
    icon: "🚀"
  },
  { 
    value: "EXPERT", 
    label: "Expert", 
    description: "5+ years, coaching others, deep expertise",
    icon: "🎯"
  },
]

const conversationModes = [
  { value: "DIRECT_ANSWERS", label: "Direct Answers", description: "Get straight to the point answers" },
  { value: "GUIDED_QUESTIONS", label: "Guided Questions", description: "Interactive coaching approach" },
]

export function UserProfile() {
  const { data: session, update } = useSession() || {}
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    agileRole: session?.user?.agileRole || "SCRUM_MASTER",
    experienceLevel: session?.user?.experienceLevel || "INTERMEDIATE",
    preferredMode: session?.user?.preferredMode || "GUIDED_QUESTIONS",
    ttsEnabled: session?.user?.ttsEnabled ?? true,
    ttsVoice: session?.user?.ttsVoice || "male-professional",
  })

  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullName: session.user.name || "",
        email: session.user.email || "",
        agileRole: session.user.agileRole || "SCRUM_MASTER",
        experienceLevel: session.user.experienceLevel || "INTERMEDIATE",
        preferredMode: session.user.preferredMode || "GUIDED_QUESTIONS",
        ttsEnabled: session.user.ttsEnabled ?? true,
        ttsVoice: session.user.ttsVoice || "male-professional",
      })
    }
  }, [session])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()
      
      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          ...result.user
        }
      })
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      })
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSubscriptionBadge = () => {
    if (session?.user?.isAdmin) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">
        <Crown className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    }
    
    switch (session?.user?.subscriptionStatus) {
      case 'ACTIVE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pro Member</Badge>
      case 'TRIALING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Trial</Badge>
      case 'PAST_DUE':
        return <Badge variant="destructive">Past Due</Badge>
      case 'CANCELED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Canceled</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile Overview
            </div>
            {getSubscriptionBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Agile Role</p>
                <p className="text-sm text-gray-600">
                  {session?.user?.agileRole?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Experience Level</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  {session?.user?.experienceLevel === 'BEGINNER' && '🌱'}
                  {session?.user?.experienceLevel === 'INTERMEDIATE' && '📚'}
                  {session?.user?.experienceLevel === 'ADVANCED' && '🚀'}
                  {session?.user?.experienceLevel === 'EXPERT' && '🎯'}
                  {session?.user?.experienceLevel || 'Intermediate'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-gray-600">
                  {session?.user ? new Date().toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Voice Settings</p>
                <p className="text-sm text-gray-600">
                  {session?.user?.ttsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>

          <Separator />

          {/* Agile Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Agile Preferences</h4>
            
            <div className="space-y-2">
              <Label>Your Agile Role</Label>
              <Select 
                value={formData.agileRole} 
                onValueChange={(value) => handleInputChange('agileRole', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {agileRoles?.map((role) => (
                    <SelectItem key={role?.value || "fallback"} value={role?.value || "SCRUM_MASTER"}>
                      {role?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select 
                value={formData.experienceLevel} 
                onValueChange={(value) => handleInputChange('experienceLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels?.map((level) => (
                    <SelectItem key={level?.value || "fallback"} value={level?.value || "INTERMEDIATE"}>
                      <div className="flex items-center gap-2">
                        <span>{level?.icon}</span>
                        <div>
                          <p className="font-medium">{level?.label}</p>
                          <p className="text-xs text-gray-500">{level?.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Atlas will tailor responses based on your role and experience level
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conversation Style</Label>
              <Select 
                value={formData.preferredMode} 
                onValueChange={(value) => handleInputChange('preferredMode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select conversation style" />
                </SelectTrigger>
                <SelectContent>
                  {conversationModes?.map((mode) => (
                    <SelectItem key={mode?.value || "fallback"} value={mode?.value || "GUIDED_QUESTIONS"}>
                      <div>
                        <p className="font-medium">{mode?.label}</p>
                        <p className="text-xs text-gray-500">{mode?.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Voice & Audio Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Voice & Audio Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Text-to-Speech</Label>
                <p className="text-sm text-gray-600">Enable voice responses from Atlas</p>
              </div>
              <Switch
                checked={formData.ttsEnabled}
                onCheckedChange={(checked) => handleInputChange('ttsEnabled', checked)}
              />
            </div>

            {formData.ttsEnabled && (
              <div className="space-y-2">
                <Label>Voice Type</Label>
                <Select 
                  value={formData.ttsVoice} 
                  onValueChange={(value) => handleInputChange('ttsVoice', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male-professional">Male Professional</SelectItem>
                    <SelectItem value="male-casual">Male Casual</SelectItem>
                    <SelectItem value="male-deep">Male Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
