

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Get OpenAI API key from environment variable
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" }, 
        { status: 500 }
      )
    }

    // Call OpenAI Text-to-Speech API with optimized settings for speed
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1", // Fast model for real-time responses
        voice: "echo", // Natural male voice
        input: text.slice(0, 1500), // Reduced length for much faster processing (3-5s vs 20-30s)
        response_format: "mp3", // MP3 is fastest format
        speed: 1.1, // Slightly faster for quicker turnaround
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI TTS error:", errorText)
      
      // Return fallback configuration for browser voices
      return NextResponse.json({
        useFallback: true,
        text,
        voiceConfig: {
          rate: 1.0,
          pitch: 0.9,
          volume: 1.0,
          voicePreferences: [
            'Alex', 'Daniel', 'Fred',
            'Microsoft David Desktop', 'Microsoft Mark',
            'Google UK English Male', 'Google US English Male',
            'male'
          ]
        }
      })
    }

    // Return the audio as a blob
    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: "Failed to process TTS request" }, 
      { status: 500 }
    )
  }
}
