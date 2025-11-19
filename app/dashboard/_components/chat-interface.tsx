
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, MessageSquare, Volume2, VolumeX, Mic, MicOff, Headphones, BookOpen, Copy, StopCircle, PlusCircle, Sparkles, FileText, Lightbulb, ThumbsUp, Paperclip, X, Zap, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ContributionDialog } from "./contribution-dialog"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Badge } from "@/components/ui/badge"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  referencedDocuments?: string[]
  attachments?: Array<{
    id: string
    name: string
    type: string
  }>
}

interface ChatInterfaceProps {
  // No props needed - standalone chat interface
}

// Suggested questions for empty state
const SUGGESTED_QUESTIONS = [
  "Help me plan my next sprint",
  "Explain user story acceptance criteria",
  "What are SAFe program increments?",
  "How do I conduct a retrospective?",
  "Best practices for daily stand-ups",
  "How to write better user stories?"
]

export function ChatInterface() {
  const { data: session } = useSession() || {}
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [hasActivatedVoice, setHasActivatedVoice] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showContributionDialog, setShowContributionDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const welcomeMessageRef = useRef<string>("")
  const previousUserQuestion = useRef<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [lastUploadedDoc, setLastUploadedDoc] = useState<{ id: string; name: string; type: string } | null>(null)
  const [jiraMode, setJiraMode] = useState(false)
  const [hasJiraDatasets, setHasJiraDatasets] = useState(false)

  // Avatar removed - voice features now inline in chat interface

  // Check if first visit for onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('atlas_onboarding_seen')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
      localStorage.setItem('atlas_onboarding_seen', 'true')
    }
  }, [])

  // Check if user has Jira datasets
  useEffect(() => {
    const checkJiraDatasets = async () => {
      try {
        const response = await fetch('/api/jira/datasets')
        if (response.ok) {
          const data = await response.json()
          setHasJiraDatasets(data.datasets && data.datasets.length > 0)
        }
      } catch (error) {
        console.error('Failed to check Jira datasets:', error)
      }
    }
    checkJiraDatasets()
  }, [])

  // Helper to format role name properly (converts "agile_coach" to "Agile Coach")
  const formatRoleName = (role: string | undefined) => {
    if (!role) return 'professional'
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Load voice preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('atlas_speak_preference')
    if (savedPreference !== null) {
      setAutoSpeak(savedPreference === 'true')
    }
  }, [])

  // Add initial welcome message immediately
  useEffect(() => {
    const welcomeContent = `Hello ${session?.user?.name || "there"}! I'm Atlas Maximus, your Agile learning companion. As a ${formatRoleName(session?.user?.agileRole)}, I'm here to help you with Scrum, SAFe, and all things Agile. What would you like to learn about today?`
    
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: welcomeContent,
      timestamp: new Date()
    }
    
    // Store for speaking
    welcomeMessageRef.current = welcomeContent
    setMessages([welcomeMessage])
    
    // Speak welcome message if voice is enabled
    if (autoSpeak) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('atlas-speak', { 
          detail: { text: welcomeContent } 
        }))
        // Avatar removed - no need to signal speaking state
      }, 1000)
    }
  }, [session, autoSpeak])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus input box on page load
  useEffect(() => {
    // Focus after a brief delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        textareaRef.current?.focus()
      }
      // Ctrl/Cmd + Shift + N for new conversation
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handleNewConversation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onstart = () => {
            setIsListening(true)
          }

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0])
              .map((result) => result.transcript)
              .join('')

            setInputMessage(transcript)
            
            // When the result is final (user stopped speaking), auto-submit
            if (event.results[0].isFinal) {
              setIsRecording(false)
              setIsListening(false)
              
              // Auto-submit the message after a brief delay to ensure state is updated
              setTimeout(() => {
                if (transcript.trim()) {
                  // Create a synthetic form event
                  const syntheticEvent = new Event('submit', { bubbles: true, cancelable: true }) as any
                  syntheticEvent.preventDefault = () => {}
                  handleSubmit(syntheticEvent, transcript.trim())
                }
              }, 100)
            }
          }

          recognition.onerror = (event: any) => {
            setIsRecording(false)
            setIsListening(false)
            
            if (event.error === 'not-allowed') {
              toast({
                title: "Microphone Access Denied",
                description: "Please allow microphone access in your browser settings to use voice input.",
                variant: "destructive",
              })
            } else if (event.error === 'not-supported' || event.error === 'service-not-allowed') {
              toast({
                title: "Voice Input Not Supported",
                description: "Voice input is not supported on this browser. Try using Chrome, Edge, or desktop Safari.",
                variant: "destructive",
              })
            } else if (event.error !== 'no-speech') {
              // Detect Safari iOS specifically
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
              const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
              
              if (isIOS || isSafari) {
                toast({
                  title: "Voice Input Limited on Safari",
                  description: "Voice recognition has limited support on Safari. For the best experience, use Chrome or Edge.",
                  variant: "destructive",
                  duration: 5000,
                })
              } else {
                toast({
                  title: "Voice Recognition Error",
                  description: "Failed to recognize speech. Please try again.",
                  variant: "destructive",
                })
              }
            }
          }

          recognition.onend = () => {
            setIsListening(false)
            if (isRecording) {
              try {
                recognition.start()
              } catch (error) {
                setIsRecording(false)
                console.error('Failed to restart recognition:', error)
              }
            }
          }

          recognitionRef.current = recognition
          setIsSpeechRecognitionSupported(true)
        } catch (error) {
          console.error('Failed to initialize speech recognition:', error)
          setIsSpeechRecognitionSupported(false)
        }
      } else {
        setIsSpeechRecognitionSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error('Error stopping recognition:', error)
        }
      }
    }
  }, [isRecording, toast])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  const speakText = (text: string) => {
    if (autoSpeak && text) {
      // Dispatch event immediately to start TTS processing
      window.dispatchEvent(new CustomEvent('atlas-speak', { 
        detail: { text } 
      }))
      // Signal that speaking is in progress
      // Avatar removed - no need to signal speaking state
      
      // Estimate speaking duration for auto-reset
      // Average speaking rate: ~150 words per minute = ~2.5 words per second
      // Average word length: ~5 characters, so ~12.5 characters per second
      const estimatedDuration = Math.max((text.length / 12.5) * 1000, 2000)
      setTimeout(() => {
        // Avatar removed - no need to signal speaking state
      }, estimatedDuration)
    }
  }

  const speakTextOptimized = (text: string) => {
    if (!autoSpeak || !text) return

    // For shorter responses, just speak normally
    if (text.length <= 1200) {
      speakText(text)
      return
    }

    // For longer responses, take only the first meaningful chunk for immediate speech
    // This dramatically reduces TTS generation time from 20-30s to 3-5s
    // Find a good breaking point (end of sentence) within first 1200 characters
    const firstPart = text.substring(0, 1200)
    const lastPeriod = firstPart.lastIndexOf('.')
    const lastQuestion = firstPart.lastIndexOf('?')
    const lastExclamation = firstPart.lastIndexOf('!')
    
    const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation)
    
    // If we found a good break point, use it; otherwise use the full 1200 chars
    const textToSpeak = breakPoint > 500 
      ? text.substring(0, breakPoint + 1)
      : firstPart

    // Speak the optimized chunk
    speakText(textToSpeak)
  }

  const stopSpeaking = () => {
    window.dispatchEvent(new CustomEvent('atlas-stop-speaking'))
    // Avatar removed - no need to signal speaking state
  }

  const handleSubmit = async (e: React.FormEvent, customMessage?: string) => {
    e.preventDefault()
    const messageToSend = customMessage || inputMessage.trim()
    if ((!messageToSend && !selectedFile) || isLoading) return

    // Upload file first if one is selected
    let uploadedDoc: { id: string; name: string; type: string } | null = null
    if (selectedFile) {
      try {
        uploadedDoc = await uploadFile(selectedFile)
        setLastUploadedDoc(uploadedDoc)
        handleRemoveFile()
      } catch (error) {
        // Upload failed, don't proceed with message
        return
      }
    }

    // If there's no message, just upload the file and return
    if (!messageToSend) return

    // Store the user's question for potential contribution later
    previousUserQuestion.current = messageToSend

    // Use the just-uploaded doc or the last uploaded doc (if user uploaded then typed)
    const attachmentToInclude = uploadedDoc || lastUploadedDoc

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
      attachments: attachmentToInclude ? [attachmentToInclude] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          agileRole: session?.user?.agileRole,
          conversationHistory: messages.slice(-10),
          recentAttachment: attachmentToInclude, // Pass the uploaded document info
          jiraMode: jiraMode // Enable Jira query mode
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantContent }
                : msg
            )
          )
        }

        // Speak the response if auto-speak is enabled
        // Read from localStorage to get the most current value (in case state hasn't updated yet)
        const savedPreference = localStorage.getItem('atlas_speak_preference')
        const shouldSpeak = savedPreference === 'true'
        
        if (assistantContent && shouldSpeak) {
          // Dispatch event directly without relying on autoSpeak state
          // This ensures TTS triggers immediately after response completes
          const firstPart = assistantContent.substring(0, 1200)
          const lastPeriod = firstPart.lastIndexOf('.')
          const lastQuestion = firstPart.lastIndexOf('?')
          const lastExclamation = firstPart.lastIndexOf('!')
          const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation)
          
          const textToSpeak = assistantContent.length <= 1200 
            ? assistantContent 
            : (breakPoint > 500 
                ? assistantContent.substring(0, breakPoint + 1)
                : firstPart)
          
          window.dispatchEvent(new CustomEvent('atlas-speak', { 
            detail: { text: textToSpeak } 
          }))
          // Avatar removed - no need to signal speaking state
        }
      }
      
      // Clear the last uploaded doc after message is sent successfully
      setLastUploadedDoc(null)
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleRecording = () => {
    if (!recognitionRef.current || !isSpeechRecognitionSupported) {
      // Detect browser to provide specific guidance
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      
      let description = "Voice input is not available on this browser. "
      
      if (isIOS) {
        description += "Safari on iOS doesn't support voice recognition. Please use the keyboard to type your question, or try using Chrome on desktop."
      } else if (isSafari) {
        description += "Safari has limited voice recognition support. For the best experience, please use Chrome, Edge, or Firefox."
      } else {
        description += "Please try using Chrome, Edge, or Firefox for voice input."
      }
      
      toast({
        title: "Voice Input Not Supported",
        description,
        variant: "destructive",
        duration: 7000,
      })
      return
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Failed to stop recording:', error)
      }
      setIsRecording(false)
      setIsListening(false)
    } else {
      setIsRecording(true)
      setHasActivatedVoice(true)
      setInputMessage("")
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start recording:', error)
        setIsRecording(false)
        toast({
          title: "Microphone Error",
          description: "Failed to access microphone. Please check your browser permissions and try again.",
          variant: "destructive",
        })
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    })
  }

  const handleNewConversation = () => {
    if (messages.length > 1) {
      const confirmed = window.confirm("Start a new conversation? Current chat will be cleared.")
      if (!confirmed) return
    }
    
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Hello ${session?.user?.name || "there"}! I'm Atlas Maximus, your Agile learning companion. What would you like to learn about today?`,
      timestamp: new Date()
    }])
    setInputMessage("")
    stopSpeaking()
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
    textareaRef.current?.focus()
  }

  const handleShareExperience = (message: ChatMessage) => {
    setSelectedMessage(message)
    setShowContributionDialog(true)
  }

  const handleMarkHelpful = async (messageId: string) => {
    toast({
      title: "Thanks for the feedback!",
      description: "Your feedback helps Atlas learn and improve.",
    })
    // Could track this in analytics or database
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]

    if (!supportedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload PDF, Word, PowerPoint, Image, or Text files",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    toast({
      title: "File attached",
      description: `${file.name} ready to upload`,
    })
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File): Promise<{ id: string; name: string; type: string }> => {
    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      toast({
        title: "File uploaded successfully! 📄",
        description: `${file.name} is being processed. You can now ask questions about it.`,
      })

      // Return document info in the format we need
      return {
        id: data.document.id,
        name: data.document.originalName,
        type: data.document.fileType
      }
    } catch (error) {
      console.error('File upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsUploadingFile(false)
    }
  }

  return (
    <>
      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Welcome to Atlas Maximus! 👋
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Your AI-powered Agile learning companion
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Ask Me Anything</h4>
                <p className="text-sm text-gray-600">Get expert guidance on Scrum, SAFe, and Agile methodologies</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Mic className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Voice Input</h4>
                <p className="text-sm text-gray-600">Click the microphone button to speak your questions (works best on Chrome, Edge, or Firefox)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Headphones className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Natural Voice</h4>
                <p className="text-sm text-gray-600">Choose to hear responses with a professional AI voice</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Paperclip className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Attach Files</h4>
                <p className="text-sm text-gray-600">Click the paperclip icon to upload documents directly in the chat</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-600 font-medium mb-2">⌨️ Keyboard Shortcuts</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Ctrl+K</kbd> Focus input</p>
                <p><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Ctrl+Shift+N</kbd> New conversation</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowOnboarding(false)} className="w-full">
            Get Started
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Chat with Atlas
            </CardTitle>
            {/* Role-Aware Expert Mode Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {session?.user?.experienceLevel === 'BEGINNER' && '🌱'}
                    {session?.user?.experienceLevel === 'INTERMEDIATE' && '📚'}
                    {session?.user?.experienceLevel === 'ADVANCED' && '🚀'}
                    {session?.user?.experienceLevel === 'EXPERT' && '🎯'}
                    {session?.user?.experienceLevel?.charAt(0) || 'I'}
                    {session?.user?.experienceLevel === 'INTERMEDIATE' ? 'ntermediate' : session?.user?.experienceLevel?.slice(1).toLowerCase() || 'ntermediate'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">Role-Aware Expert Mode Active</p>
                    <p className="text-xs">Role: {formatRoleName(session?.user?.agileRole)}</p>
                    <p className="text-xs">Level: {session?.user?.experienceLevel || 'Intermediate'}</p>
                    <p className="text-xs text-gray-400 mt-1">Responses tailored to your experience level</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Jira Mode Toggle */}
            {hasJiraDatasets && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={jiraMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newMode = !jiraMode
                        setJiraMode(newMode)
                        toast({
                          title: newMode ? "Jira Mode Enabled" : "Jira Mode Disabled",
                          description: newMode 
                            ? "Ask questions about your Jira backlog" 
                            : "Switched back to general Agile chat",
                          duration: 2000,
                        })
                      }}
                      className={jiraMode 
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs" 
                        : "text-xs border-green-200 hover:bg-green-50"
                      }
                    >
                      <Database className="h-3 w-3 mr-1" />
                      {jiraMode ? "Jira Mode" : "Jira"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">Ask Me Anything from Jira</p>
                      <p className="text-xs text-gray-400">
                        {jiraMode 
                          ? "Query your uploaded Jira data with natural language" 
                          : "Enable to ask questions about your Jira backlog"
                        }
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewConversation}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Conversation (Ctrl+Shift+N)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValue = !autoSpeak
                      setAutoSpeak(newValue)
                      if (newValue) {
                        setHasActivatedVoice(true)
                      }
                      localStorage.setItem('atlas_speak_preference', String(newValue))
                      toast({
                        title: newValue ? "Voice Enabled" : "Voice Disabled",
                        description: newValue ? "Atlas will now speak responses" : "Atlas will only show text",
                        duration: 2000,
                      })
                    }}
                    className={autoSpeak ? 'text-blue-600' : 'text-gray-400'}
                  >
                    {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{autoSpeak ? 'Voice On' : 'Voice Off'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-2">
            {/* Suggested questions for empty state */}
            {messages.length <= 1 && (
              <div className="py-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium text-gray-700">Try asking me:</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left px-3 py-2 text-sm bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg border border-blue-200 transition-all transform hover:scale-102"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages?.map((message) => (
              <div
                key={message?.id}
                className={`flex ${message?.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message?.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}
                >
                  {/* Show attachments for user messages */}
                  {message?.role === 'user' && message?.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 pb-2 border-b border-blue-400">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs bg-white/10 rounded px-2 py-1">
                          {attachment.type.startsWith('image/') ? (
                            <>
                              <FileText className="h-3 w-3" />
                              <span>📷 {attachment.name}</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              <span>📄 {attachment.name}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message?.role === 'assistant' ? (
                    <MarkdownRenderer content={message?.content || ''} className="text-sm" />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message?.content}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message?.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message?.timestamp?.toLocaleTimeString()}
                    </p>
                    
                    {message?.role === 'assistant' && (
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleMarkHelpful(message.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-100 rounded"
                              >
                                <ThumbsUp className="h-3 w-3 text-green-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleShareExperience(message)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-yellow-100 rounded"
                              >
                                <Lightbulb className="h-3 w-3 text-yellow-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share your experience</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                              >
                                <Copy className="h-3 w-3 text-gray-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy message</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  {message?.referencedDocuments && message.referencedDocuments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs text-gray-600 mb-1">📚 Referenced documents:</p>
                      <div className="space-y-1">
                        {message.referencedDocuments.map((doc, idx) => (
                          <p key={idx} className="text-xs text-gray-700">• {doc}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Atlas is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 pt-2 border-t bg-white/50">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Selected File Badge */}
            {selectedFile && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-900 flex-1 truncate">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "🎤 Listening... Speak now!" : "Type your question here..."}
                  className="w-full min-h-[60px] max-h-[120px] resize-none focus:ring-2 focus:ring-blue-500 pr-28"
                  disabled={isLoading || isRecording}
                  aria-label="Chat message input"
                />
                {/* Mic button integrated into input */}
                <div className="absolute right-2 top-2 flex space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          onClick={toggleRecording}
                          disabled={isLoading}
                          className={`${
                            isRecording 
                              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                              : 'bg-gray-600 hover:bg-gray-700'
                          } h-9 w-9 p-0`}
                        >
                          {isRecording ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isRecording ? 'Stop recording' : isSpeechRecognitionSupported ? 'Voice input' : 'Voice input (not supported on this browser)'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={(!inputMessage.trim() && !selectedFile) || isLoading || isRecording || isUploadingFile}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-9 w-9 p-0"
                        >
                          {isLoading || isUploadingFile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message (Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploadingFile}
                      className="bg-purple-600 hover:bg-purple-700 px-6 transition-all"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File upload input"
            />

            {isListening && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 animate-pulse">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Listening...</span>
              </div>
            )}

            {autoSpeak && isLoading && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={stopSpeaking}
                  className="text-xs"
                >
                  <StopCircle className="h-3 w-3 mr-1" />
                  Stop Speaking
                </Button>
              </div>
            )}
          </form>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Press <kbd className="px-1 py-0.5 bg-gray-200 border rounded text-xs">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-gray-200 border rounded text-xs">Shift+Enter</kbd> for new line</span>
            <span className={`flex items-center ${autoSpeak ? 'text-blue-600' : 'text-gray-400'}`}>
              {autoSpeak ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
              {autoSpeak ? 'Voice on' : 'Voice off'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Contribution Dialog */}
    {selectedMessage && (
      <ContributionDialog
        open={showContributionDialog}
        onOpenChange={setShowContributionDialog}
        originalQuestion={previousUserQuestion.current}
        atlasResponse={selectedMessage.content}
        onContributionSaved={() => {
          toast({
            title: "Experience Shared! 🎉",
            description: "Atlas will now use your insights to help others.",
          })
        }}
      />
    )}
    </>
  )
}
