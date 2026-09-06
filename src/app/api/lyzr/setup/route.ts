import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LYZR_BASES = [
  'https://agent-prod.studio.lyzr.ai',
  'https://agent.api.lyzr.ai',
]

// Auto-detect working Lyzr base URL and create the FollowThrough agent
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.LYZR_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'LYZR_API_KEY not set' }, { status: 500 })

  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' }

  // Step 1: find working base URL
  let workingBase: string | null = null
  for (const base of LYZR_BASES) {
    try {
      const r = await fetch(`${base}/v3/inference/chat/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ agent_id: 'probe', session_id: 'probe', user_id: user.id, message: 'ping' }),
      })
      // 422 = right endpoint, wrong agent_id — that's the working base
      if (r.status === 422 || r.status === 200 || r.status === 404) {
        workingBase = base
        break
      }
    } catch { continue }
  }

  if (!workingBase) return NextResponse.json({ error: 'Could not reach Lyzr API from server' }, { status: 502 })

  // Step 2: create the agent
  const agentPayload = {
    name: 'FollowThrough Agent',
    agent_description: 'Tracks open commitment loops and drafts professional follow-up emails for human approval.',
    llm_config: {
      model: 'gpt-4o-mini',
      temperature: 0.4,
      top_p: 0.9,
    },
    prompt_config: [{
      system_prompt: `You are the FollowThrough AI assistant. You help professionals track commitments others owe them and draft follow-up messages.

Rules:
- NEVER send anything without explicit human approval
- Be concise and professional
- Personalize tone based on urgency: gentle for first nudge, firm for repeat, urgent for overdue >7 days
- Always end messages naturally, no placeholder text`,
      role: 'system',
    }],
    memory_config: { memory_enabled: true },
  }

  const createRes = await fetch(`${workingBase}/v3/agent/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(agentPayload),
  })

  const createText = await createRes.text()
  let agentData: Record<string, unknown>
  try { agentData = JSON.parse(createText) } catch { agentData = { raw: createText } }

  if (!createRes.ok) {
    return NextResponse.json({
      error: 'Agent creation failed',
      status: createRes.status,
      detail: agentData,
      working_base: workingBase,
    }, { status: 500 })
  }

  const agentId = (agentData.agent_id ?? agentData.id ?? agentData._id) as string

  return NextResponse.json({
    success: true,
    agent_id: agentId,
    working_base: workingBase,
    agent: agentData,
    next_step: `Set LYZR_AGENT_ID=${agentId} in Vercel env vars`,
  })
}

// GET: probe what's reachable and return agent list
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.LYZR_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'LYZR_API_KEY not set' }, { status: 500 })

  const headers = { 'x-api-key': apiKey }
  const results: Record<string, unknown> = {}

  for (const base of LYZR_BASES) {
    try {
      const r = await fetch(`${base}/v3/agent/`, { headers })
      const text = await r.text()
      results[base] = { status: r.status, body: text.slice(0, 500) }
    } catch (e: unknown) {
      results[base] = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  return NextResponse.json({ probe_results: results, api_key_prefix: apiKey.slice(0, 20) + '…' })
}
