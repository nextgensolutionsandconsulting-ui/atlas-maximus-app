
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName || user.name,
          image: user.image,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        }
      }
      
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: token.id as string
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            name: true,
            image: true,
            agileRole: true,
            experienceLevel: true,
            isAdmin: true,
            subscriptionStatus: true,
            ttsEnabled: true,
            ttsVoice: true,
            preferredMode: true,
          }
        })

        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            name: dbUser.fullName || dbUser.name,
            agileRole: dbUser.agileRole,
            experienceLevel: dbUser.experienceLevel,
            isAdmin: dbUser.isAdmin,
            subscriptionStatus: dbUser.subscriptionStatus,
            ttsEnabled: dbUser.ttsEnabled,
            ttsVoice: dbUser.ttsVoice,
            preferredMode: dbUser.preferredMode,
          }
        }
      }
      return session
    },
  },
}
