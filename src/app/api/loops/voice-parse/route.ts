import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ParsedLoop {
  counterparty: string
  description: string
  expected_by: string      // ISO date string
  direction: 'inbound' | 'outbound'
  confidence: number
  raw_transcript: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transcript } = await request.json()
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 5) {
    return NextResponse.json({ error: 'Transcript too short' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Gemini not configured' }, { status: 500 })

  const today = new Date().toISOString().split('T')[0]
  const todayFull = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const systemPrompt = `You are a loop-tracking assistant. Extract a follow-up loop from a voice transcript.

Today is ${todayFull} (${today}).

A "loop" is: someone owes someone else something (a document, a call back, a decision, a payment, feedback, etc.).

Extract these fields from the transcript:
- counterparty: the OTHER person's name or company (not the speaker)
- description: what is owed / what needs to happen (concise, action-oriented, 5-15 words)
- expected_by: the deadline as an ISO date (YYYY-MM-DD). If "tomorrow" → ${new Date(Date.now()+86400000).toISOString().split('T')[0]}. If "next week" → ${new Date(Date.now()+7*86400000).toISOString().split('T')[0]}. If "end of month" → last day of current month. If no date mentioned → 7 days from today.
- direction: "inbound" if the OTHER person owes the speaker something, "outbound" if the speaker owes the other person
- confidence: 0.0-1.0 how confident you are in the extraction

Respond ONLY with valid JSON, no explanation:
{
  "counterparty": "...",
  "description": "...",
  "expected_by": "YYYY-MM-DD",
  "direction": "inbound" | "outbound",
  "confidence": 0.0-1.0
}`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nTranscript: "${transcript}"` }] },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 500 })
  }

  const geminiData = await geminiRes.json()
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed: Omit<ParsedLoop, 'raw_transcript'>
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse Gemini response', raw: rawText }, { status: 500 })
  }

  // Validate required fields
  if (!parsed.counterparty || !parsed.description || !parsed.expected_by) {
    return NextResponse.json({
      error: 'Could not extract all required fields from your recording. Try again with more detail.',
      partial: parsed,
    }, { status: 422 })
  }

  const result: ParsedLoop = { ...parsed, raw_transcript: transcript }
  return NextResponse.json({ loop: result })
}
