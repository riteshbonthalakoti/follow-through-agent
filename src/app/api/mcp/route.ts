import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MCP_TOOLS } from '@/lib/mcp/tools'
import type { LoopState } from '@/types/loop'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-MCP-Secret, Authorization',
}

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers: CORS })
}

function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { headers: CORS })
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// GET — capability discovery (some MCP clients probe this)
export async function GET() {
  return NextResponse.json({
    jsonrpc: '2.0',
    result: { tools: MCP_TOOLS },
    id: null,
  }, { headers: CORS })
}

// POST — standard MCP JSON-RPC 2.0
export async function POST(request: NextRequest) {
  let body: { jsonrpc?: string; method?: string; params?: Record<string, unknown>; id?: unknown }
  try {
    body = await request.json()
  } catch {
    return err(null, -32700, 'Parse error')
  }

  const { method, params = {}, id } = body

  // ── tools/list ──────────────────────────────────────────────────────────────
  if (method === 'tools/list') {
    return ok(id, { tools: MCP_TOOLS })
  }

  // ── tools/call ──────────────────────────────────────────────────────────────
  if (method === 'tools/call') {
    // Auth via header
    const xSecret = request.headers.get('X-MCP-Secret') ?? request.headers.get('x-mcp-secret')
    const authHeader = request.headers.get('Authorization') ?? ''
    const bearerSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const secret = xSecret ?? bearerSecret
    if (!process.env.MCP_SECRET || secret !== process.env.MCP_SECRET) {
      return err(id, -32001, 'Unauthorized: invalid or missing secret')
    }

    const toolName = params.name as string
    const args = (params.arguments ?? {}) as Record<string, unknown>
    const owner_id = args.owner_id as string | undefined

    if (!owner_id) {
      return err(id, -32602, 'Missing required argument: owner_id')
    }

    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // list_loops
    if (toolName === 'list_loops') {
      const state = args.state as LoopState | undefined
      const limit = typeof args.limit === 'number' ? args.limit : 20
      let query = db.from('loops').select('*').eq('owner_id', owner_id)
        .order('expected_by', { ascending: true }).limit(limit)
      if (state) query = query.eq('state', state)
      const { data, error } = await query
      if (error) return err(id, -32603, error.message)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify({ loops: data ?? [] }) }] })
    }

    // create_loop
    if (toolName === 'create_loop') {
      const { data, error } = await db.from('loops').insert({
        owner_id,
        counterparty: args.counterparty,
        description: args.description,
        expected_by: args.expected_by,
        direction: args.direction ?? 'inbound',
        source: args.source ?? 'manual',
        state: 'waiting',
        nudge_count: 0,
      }).select().single()
      if (error) return err(id, -32603, error.message)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify({ loop: data }) }] })
    }

    // update_state / transition_loop_state
    if (toolName === 'update_state' || toolName === 'transition_loop_state') {
      const loop_id = args.loop_id as string
      const to = (args.to ?? args.to_state) as LoopState
      const { data, error } = await db.from('loops')
        .update({ state: to, last_action_at: new Date().toISOString() })
        .eq('id', loop_id).eq('owner_id', owner_id).select().single()
      if (error) return err(id, -32603, error.message)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify({ loop: data }) }] })
    }

    // set_draft / draft_followup
    if (toolName === 'set_draft' || toolName === 'draft_followup') {
      const loop_id = args.loop_id as string
      const draft_text = args.draft_text as string | undefined
      const update = draft_text
        ? { next_action: draft_text, last_action_at: new Date().toISOString() }
        : { last_action_at: new Date().toISOString() }
      const { data, error } = await db.from('loops')
        .update(update).eq('id', loop_id).eq('owner_id', owner_id).select().single()
      if (error) return err(id, -32603, error.message)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify({ loop: data }) }] })
    }

    // close_loop
    if (toolName === 'close_loop') {
      const loop_id = args.loop_id as string
      const { data, error } = await db.from('loops')
        .update({ state: 'closed', next_action: null, last_action_at: new Date().toISOString() })
        .eq('id', loop_id).eq('owner_id', owner_id).select().single()
      if (error) return err(id, -32603, error.message)
      return ok(id, { content: [{ type: 'text', text: JSON.stringify({ loop: data }) }] })
    }

    return err(id, -32601, `Unknown tool: ${toolName}`)
  }

  // ── initialize / ping (some clients send these) ──────────────────────────────
  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'follow-through-agent', version: '1.0.0' },
    })
  }

  if (method === 'ping') {
    return ok(id, {})
  }

  return err(id, -32601, `Method not found: ${method}`)
}
