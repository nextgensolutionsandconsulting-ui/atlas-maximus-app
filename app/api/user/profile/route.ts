
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fullName, agileRole, experienceLevel, preferredMode, ttsEnabled, ttsVoice } = await req.json()

    // Validate agile role
    const validRoles = [
      'SCRUM_MASTER',
      'PRODUCT_OWNER', 
      'DEVELOPER',
      'TESTER',
      'AGILE_COACH',
      'RELEASE_TRAIN_ENGINEER',
      'SOLUTION_TRAIN_ENGINEER'
    ]

    if (agileRole && !validRoles.includes(agileRole)) {
      return NextResponse.json({ error: "Invalid agile role" }, { status: 400 })
    }

    // Validate experience level
    const validExperience = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
    if (experienceLevel && !validExperience.includes(experienceLevel)) {
      return NextResponse.json({ error: "Invalid experience level" }, { status: 400 })
    }

    // Validate conversation mode
    const validModes = ['DIRECT_ANSWERS', 'GUIDED_QUESTIONS']
    if (preferredMode && !validModes.includes(preferredMode)) {
      return NextResponse.json({ error: "Invalid conversation mode" }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        name: fullName, // Keep both fields in sync
        agileRole,
        experienceLevel,
        preferredMode,
        ttsEnabled: typeof ttsEnabled === 'boolean' ? ttsEnabled : undefined,
        ttsVoice
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        name: true,
        agileRole: true,
        experienceLevel: true,
        preferredMode: true,
        ttsEnabled: true,
        ttsVoice: true,
        subscriptionStatus: true,
        isAdmin: true
      }
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" }, 
      { status: 500 }
    )
  }
}

// GET user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        name: true,
        agileRole: true,
        experienceLevel: true,
        preferredMode: true,
        ttsEnabled: true,
        ttsVoice: true,
        subscriptionStatus: true,
        isAdmin: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Failed to get profile" }, 
      { status: 500 }
    )
  }
}
