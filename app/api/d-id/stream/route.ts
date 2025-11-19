
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { error: "D-ID avatar feature has been removed" },
    { status: 404 }
  )
}
