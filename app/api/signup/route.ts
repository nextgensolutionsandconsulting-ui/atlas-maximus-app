
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { AgileRole } from "@prisma/client"

// Map of label to enum value for agileRole
const agileRoleMap: Record<string, AgileRole> = {
  "Scrum Master": "SCRUM_MASTER",
  "Product Owner": "PRODUCT_OWNER",
  "Developer": "DEVELOPER",
  "Tester": "TESTER",
  "Agile Coach": "AGILE_COACH",
  "Release Train Engineer": "RELEASE_TRAIN_ENGINEER",
  "Solution Train Engineer": "SOLUTION_TRAIN_ENGINEER",
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, agileRole } = await req.json()
    
    console.log("Signup request data:", { email, password: "***", fullName, agileRole })

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Convert agileRole label to enum value if needed
    let roleValue: AgileRole = "SCRUM_MASTER"
    if (agileRole) {
      // Check if it's already a valid enum value
      if (Object.values(AgileRole).includes(agileRole as AgileRole)) {
        roleValue = agileRole as AgileRole
      } 
      // Check if it's a label that needs to be converted
      else if (agileRoleMap[agileRole]) {
        roleValue = agileRoleMap[agileRole]
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        name: fullName,
        agileRole: roleValue,
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
