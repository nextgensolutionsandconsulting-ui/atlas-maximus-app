
import { DefaultSession } from "next-auth"
import { AgileRole, SubscriptionStatus, ConversationMode, ExperienceLevel } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      agileRole: AgileRole
      experienceLevel: ExperienceLevel
      isAdmin: boolean
      subscriptionStatus: SubscriptionStatus
      ttsEnabled: boolean
      ttsVoice: string
      preferredMode: ConversationMode
    } & DefaultSession["user"]
  }
}

export type UserProfile = {
  id: string
  email: string
  fullName: string | null
  name: string | null
  agileRole: AgileRole
  experienceLevel: ExperienceLevel
  subscriptionStatus: SubscriptionStatus
  ttsEnabled: boolean
  ttsVoice: string
  preferredMode: ConversationMode
  isAdmin: boolean
  createdAt: Date
}

export type ConversationWithMessages = {
  id: string
  title: string | null
  summary: string | null
  createdAt: Date
  messages: {
    id: string
    content: string
    role: string
    audioUrl: string | null
    createdAt: Date
  }[]
}

export type DocumentWithMetadata = {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  processingStatus: string
  uploadedAt: Date
  extractedText: string | null
}
