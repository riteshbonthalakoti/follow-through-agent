import type { Loop } from '@/types/loop'

const LYZR_BASE = process.env.LYZR_BASE_URL ?? 'https://agent-prod.studio.lyzr.ai/v3'

interface LyzrMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface LyzrResponse {
  response?: string
  message?: string
  choices?: Array<{ message: { content: string } }>
}

// POST a chat message to a Lyzr agent and return the text response
export async function callLyzrAgent(agentId: string, messages: LyzrMessage[], sessionId?: string): Promise<string> {
  const apiKey = process.env.LYZR_API_KEY
  if (!apiKey) throw new Error('LYZR_API_KEY not configured')

  // Lyzr v3 payload: agent_id + session_id + user_id + message (string, not messages array)
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  const body: Record<string, unknown> = {
    agent_id: agentId,
    session_id: sessionId ?? agentId,
    user_id: 'followthrough-user',
    message: lastUserMsg,
  }

  const res = await fetch(`${LYZR_BASE}/inference/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lyzr API error ${res.status}: ${text}`)
  }

  const data: LyzrResponse = await res.json()

  // Handle Lyzr v3 response shapes
  if (typeof data.response === 'string') return data.response
  if (typeof data.message === 'string') return data.message
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content
  // v3 sometimes wraps in output field
  const d = data as Record<string, unknown>
  if (typeof d.output === 'string') return d.output
  if (typeof d.text === 'string') return d.text
  throw new Error('Unexpected Lyzr response shape: ' + JSON.stringify(data))
}

// Generate a follow-up draft for a loop using Lyzr
export async function generateFollowUpDraft(loop: Loop, agentId: string): Promise<string> {
  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(loop.expected_by).getTime()) / 86400_000))
  const nudgeOrdinal = loop.nudge_count === 0 ? 'first' : loop.nudge_count === 1 ? 'second' : `${loop.nudge_count + 1}th`

  const prompt = `You are drafting a professional follow-up email for a user.

Context:
- Counterparty: ${loop.counterparty}
- What is owed: ${loop.description}
- Status: ${loop.state} (${daysOverdue} days overdue)
- This is the ${nudgeOrdinal} follow-up attempt
- Direction: ${loop.direction === 'inbound' ? 'User is waiting on counterparty' : 'User owes counterparty'}

Write ONLY the email body (no subject line, no "From:", no headers).
Keep it under 100 words. Be ${loop.nudge_count >= 2 ? 'firm and clear about urgency' : 'polite but direct'}.
Do not add placeholders like [Your Name] — end naturally.`

  return callLyzrAgent(agentId, [{ role: 'user', content: prompt }], loop.id)
}

// List all agents in the Lyzr account
export async function listLyzrAgents() {
  const apiKey = process.env.LYZR_API_KEY
  if (!apiKey) throw new Error('LYZR_API_KEY not configured')

  const res = await fetch(`${LYZR_BASE}/agent/`, {
    headers: { 'x-api-key': apiKey },
  })
  if (!res.ok) throw new Error(`Lyzr list agents error ${res.status}: ${await res.text()}`)
  return res.json()
}
