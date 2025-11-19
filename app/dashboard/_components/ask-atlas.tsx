
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, FileText, Sparkles, BookOpen, MessageCircle, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Badge } from "@/components/ui/badge"

interface DocumentReference {
  name: string
  relevance: number
}

interface QueryResult {
  answer: string
  sources: DocumentReference[]
  confidence: "high" | "medium" | "low"
}

const COMMON_POLICY_QUESTIONS = [
  "How do we define done?",
  "What's our refinement policy?",
  "Who owns risk escalation?",
  "What is our sprint length?",
  "How do we estimate story points?",
  "What is our code review process?",
  "When do we do retrospectives?",
  "Who facilitates sprint planning?",
  "What are our quality standards?",
  "How do we handle technical debt?",
  "What is our branching strategy?",
  "When are sprint demos held?",
]

export function AskAtlas() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [history, setHistory] = useState<Array<{ question: string; answer: string; sources: DocumentReference[] }>>([])

  const handleQuery = async (questionText?: string) => {
    const queryText = questionText || query.trim()
    
    if (!queryText) {
      toast({
        title: "Empty query",
        description: "Please enter a question",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const data = await response.json()
      
      setResult(data)
      
      // Add to history
      setHistory(prev => [{
        question: queryText,
        answer: data.answer,
        sources: data.sources
      }, ...prev.slice(0, 4)]) // Keep last 5 queries

      // Clear input if it was a custom query
      if (!questionText) {
        setQuery("")
      }

    } catch (error) {
      console.error('Query error:', error)
      toast({
        title: "Error",
        description: "Failed to query knowledge base. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuery()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Ask Atlas</CardTitle>
              <CardDescription className="text-blue-100">
                Atlas remembers what your team forgot — instant answers from your docs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search Bar */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about policies, processes, or team agreements..."
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleQuery()}
              disabled={!query.trim() || isLoading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Common Questions */}
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium text-gray-700">Common questions:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {COMMON_POLICY_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(question)}
                  disabled={isLoading}
                  className="text-left px-3 py-2 text-sm bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg border border-blue-200 transition-all transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="shadow-lg border-2 border-blue-200 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                Answer
              </CardTitle>
              <Badge 
                variant={result.confidence === "high" ? "default" : result.confidence === "medium" ? "secondary" : "outline"}
                className={
                  result.confidence === "high" ? "bg-green-100 text-green-800 border-green-300" :
                  result.confidence === "medium" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                  "bg-gray-100 text-gray-800 border-gray-300"
                }
              >
                {result.confidence === "high" ? "✓ High Confidence" : 
                 result.confidence === "medium" ? "~ Medium Confidence" : 
                 "? Low Confidence"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <MarkdownRenderer content={result.answer} className="text-gray-800" />
            
            {result.sources && result.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Sources ({result.sources.length} document{result.sources.length !== 1 ? 's' : ''})
                </p>
                <div className="space-y-2">
                  {result.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{source.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(source.relevance * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.confidence === "low" && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> The answer confidence is low. This might mean the information isn't in your documents, 
                  or the question needs to be more specific. Try rephrasing or upload relevant documents.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-gray-600" />
              Recent Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => {
                      setResult({
                        answer: item.answer,
                        sources: item.sources,
                        confidence: "high"
                      })
                    }}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Q: {item.question}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.answer.substring(0, 120)}...
                    </p>
                    {item.sources.length > 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        📚 {item.sources.length} source{item.sources.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && !isLoading && history.length === 0 && (
        <Card className="shadow-md border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No queries yet
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Ask Atlas about your team's policies, processes, definitions, or any information in your uploaded documents. 
              Try clicking one of the common questions above to get started!
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="text-xs px-3 py-1">
                ⚡ Instant Answers
              </Badge>
              <Badge variant="outline" className="text-xs px-3 py-1">
                📚 From Your Docs
              </Badge>
              <Badge variant="outline" className="text-xs px-3 py-1">
                🎯 Policy Questions
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
