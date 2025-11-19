
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lightbulb, CheckCircle } from "lucide-react"

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalQuestion: string
  atlasResponse: string
  onContributionSaved?: () => void
}

const CONTRIBUTION_TYPES = [
  { value: "SOLUTION", label: "Solution - How I solved a similar problem", icon: "💡" },
  { value: "EXPERIENCE", label: "Experience - What worked/didn't work for me", icon: "📝" },
  { value: "BEST_PRACTICE", label: "Best Practice - A tip or technique", icon: "⭐" },
  { value: "LESSON_LEARNED", label: "Lesson Learned - What I learned", icon: "🎓" },
  { value: "REAL_WORLD_EXAMPLE", label: "Real Example - From my team/project", icon: "🌍" },
  { value: "ALTERNATIVE_APPROACH", label: "Alternative - A different way", icon: "🔄" },
]

export function ContributionDialog({
  open,
  onOpenChange,
  originalQuestion,
  atlasResponse,
  onContributionSaved
}: ContributionDialogProps) {
  const { toast } = useToast()
  const [contributionType, setContributionType] = useState<string>("")
  const [userExperience, setUserExperience] = useState("")
  const [scenario, setScenario] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contributionType || !userExperience) {
      toast({
        title: "Missing Information",
        description: "Please select a type and share your experience.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributionType,
          originalQuestion,
          atlasResponse,
          userExperience,
          scenario: scenario || null,
          isPublic
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save contribution')
      }

      setIsSubmitted(true)
      
      setTimeout(() => {
        onOpenChange(false)
        setIsSubmitted(false)
        setContributionType("")
        setUserExperience("")
        setScenario("")
        onContributionSaved?.()
      }, 2000)

    } catch (error) {
      console.error('Error saving contribution:', error)
      toast({
        title: "Error",
        description: "Failed to save your contribution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Share Your Experience</span>
              </DialogTitle>
              <DialogDescription>
                Help Atlas learn from your real-world experience! Your insights will help other users facing similar challenges.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">What would you like to share?</Label>
                <Select value={contributionType} onValueChange={setContributionType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRIBUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Your Experience *</Label>
                <Textarea
                  id="experience"
                  value={userExperience}
                  onChange={(e) => setUserExperience(e.target.value)}
                  placeholder="Share what you did, what worked, what you learned, or how you approached this situation..."
                  className="min-h-[120px]"
                  required
                />
                <p className="text-xs text-gray-500">
                  Be specific and actionable. Examples help others understand your experience better.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenario">Context (Optional)</Label>
                <Textarea
                  id="scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Describe your team, project, or situation for context..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-gray-500">
                  e.g., "5-person dev team", "enterprise SAFe transformation", "startup environment"
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="public" className="font-medium cursor-pointer">
                      Share with the Atlas community
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      By sharing publicly, you're helping other Agile practitioners learn from your experience. 
                      Your name will be shown as the contributor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !contributionType || !userExperience}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Share Experience
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You! 🎉
            </h3>
            <p className="text-gray-600 mb-1">
              Your experience has been added to Atlas's knowledge base.
            </p>
            <p className="text-sm text-gray-500">
              Other users will benefit from your insights!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
