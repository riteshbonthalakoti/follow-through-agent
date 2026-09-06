// Uses Gemini free API to detect open loops from email threads

interface EmailThread {
  id: string
  subject: string
  snippet: string
  participants: string[]
  lastMessageDate: string
}

interface DetectedLoop {
  counterparty: string
  description: string
  expected_by: string
  confidence: number
  thread_id: string
}

export async function detectLoopsFromThreads(
  threads: EmailThread[],
  userEmail: string
): Promise<DetectedLoop[]> {
  if (!process.env.GEMINI_API_KEY || threads.length === 0) return []

  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are analyzing email threads to detect "open loops" — any pending action, reply, commitment, or deliverable that has not been resolved yet.

User's email: ${userEmail}
Today's date: ${today}

Email threads:
${threads.map((t, i) => `
[${i + 1}] Subject: ${t.subject}
Participants: ${t.participants.join(', ')}
Date: ${t.lastMessageDate}
Preview: ${t.snippet}
`).join('\n')}

Detect ANY thread where:
- Someone promised to send something (document, feedback, money, reply, file)
- A meeting or call was mentioned and needs confirmation
- Someone asked for something and hasn't gotten a reply
- There's a deadline, due date, or follow-up implied
- The conversation ended without resolution

Be GENEROUS — if there's any chance it's an open commitment, include it.
Return JSON for EVERY thread that might have a pending action (both inbound and outbound).
If truly nothing is pending in any thread, return [].

Return ONLY valid JSON array, no markdown:
[
  {
    "thread_index": 1,
    "counterparty": "First name or company name",
    "description": "What is pending (one clear sentence)",
    "expected_by": "YYYY-MM-DD (default: 7 days from today if unclear)",
    "confidence": 0.0-1.0,
    "direction": "inbound or outbound"
  }
]`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    }
  )

  if (!res.ok) return []

  const result = await res.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0])
    return parsed.map((item: { thread_index: number; counterparty: string; description: string; expected_by: string; confidence: number }) => ({
      ...item,
      thread_id: threads[item.thread_index - 1]?.id ?? '',
    }))
  } catch {
    return []
  }
}
