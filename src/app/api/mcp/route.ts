import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { MCP_TOOLS } from '@/lib/mcp/tools'
import { validateTransition, getTransitionReason } from '@/lib/loops/state-machine'
import { createLoopSchema } from '@/lib/loops/schema'
import type { Loop, LoopState } from '@/types/loop'

const AVAILABLE_TOOLS = ['list_loops', 'create_loop', 'update_state', 'set_draft', 'close_loop']

const VALID_TRANSITIONS: Record<LoopState, LoopState[]> = {
  waiting:   ['due', 'closed'],
  due:       ['overdue', 'closed'],
  overdue:   ['escalated', 'closed'],
  escalated: ['waiting', 'closed'],
  closed:    [],
}

export async function GET() {
  return NextResponse.json({ tools: MCP_TOOLS })
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-MCP-Secret')
  if (!process.env.MCP_SECRET || secret !== process.env.MCP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tool, params = {}, owner_id } = body as {
    tool: string
    params: Record<string, unknown>
    owner_id: string
  }

  if (!tool || !owner_id) {
    return NextResponse.json({ error: 'Missing required fields: tool, owner_id' }, { status: 400 })
  }

  if (!AVAILABLE_TOOLS.includes(tool)) {
    return NextResponse.json(
      { error: `Unknown tool: ${tool}`, available: AVAILABLE_TOOLS },
      { status: 400 }
    )
  }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (tool === 'list_loops') {
    const state = params.state as LoopState | undefined
    const limit = typeof params.limit === 'number' ? params.limit : 20

    let query = db
      .from('loops')
      .select('*')
      .eq('owner_id', owner_id)
      .order('expected_by', { ascending: true })
      .limit(limit)

    if (state) query = query.eq('state', state)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ loops: data ?? [] })
  }

  if (tool === 'create_loop') {
    const parsed = createLoopSchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data, error } = await db
      .from('loops')
      .insert({ ...parsed.data, owner_id, state: 'waiting', nudge_count: 0 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ loop: data })
  }

  if (tool === 'update_state') {
    const { loop_id, to, reason } = params as { loop_id: string; to: LoopState; reason?: string }

    const { data: loop, error: fetchErr } = await db
      .from('loops')
      .select('*')
      .eq('id', loop_id)
      .eq('owner_id', owner_id)
      .single<Loop>()

    if (fetchErr || !loop) {
      return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
    }

    if (!validateTransition(loop.state, to)) {
      return NextResponse.json(
        { error: 'Invalid transition', allowed: VALID_TRANSITIONS[loop.state] },
        { status: 400 }
      )
    }

    if (to === 'escalated' && !loop.next_action) {
      return NextResponse.json({ error: 'Draft required before escalating' }, { status: 400 })
    }

    const updatePayload: Partial<Loop> & { state: LoopState } = {
      state: to,
      last_action_at: new Date().toISOString(),
    }

    if (loop.state === 'escalated' && to === 'waiting') {
      const newExpected = new Date()
      newExpected.setDate(newExpected.getDate() + 3)
      updatePayload.expected_by = newExpected.toISOString()
      updatePayload.nudge_count = (loop.nudge_count ?? 0) + 1
    }

    if (to === 'closed') updatePayload.next_action = null

    const { data: updated, error: updateErr } = await db
      .from('loops')
      .update(updatePayload)
      .eq('id', loop_id)
      .select()
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({
      loop: updated,
      transition: {
        from: loop.state,
        to,
        reason: reason ?? getTransitionReason(loop.state, to),
      },
    })
  }

  if (tool === 'set_draft') {
    const { loop_id, draft_text } = params as { loop_id: string; draft_text: string }

    const { data, error } = await db
      .from('loops')
      .update({ next_action: draft_text, last_action_at: new Date().toISOString() })
      .eq('id', loop_id)
      .eq('owner_id', owner_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ loop: data })
  }

  if (tool === 'close_loop') {
    const { loop_id, reason } = params as { loop_id: string; reason?: string }

    const { data, error } = await db
      .from('loops')
      .update({
        state: 'closed',
        next_action: null,
        last_action_at: new Date().toISOString(),
      })
      .eq('id', loop_id)
      .eq('owner_id', owner_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ loop: data, reason: reason ?? 'Closed via MCP' })
  }

  // Should never reach here given the AVAILABLE_TOOLS check above
  return NextResponse.json({ error: `Unknown tool: ${tool}`, available: AVAILABLE_TOOLS }, { status: 400 })
}
