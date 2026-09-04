import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stateTransitionSchema } from '@/lib/loops/schema'
import { validateTransition, getTransitionReason } from '@/lib/loops/state-machine'
import type { Loop, LoopState } from '@/types/loop'

type Params = { params: Promise<{ id: string }> }

const VALID_TRANSITIONS: Record<LoopState, LoopState[]> = {
  waiting:   ['due', 'closed'],
  due:       ['overdue', 'closed'],
  overdue:   ['escalated', 'closed'],
  escalated: ['waiting', 'closed'],
  closed:    [],
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: loop, error: fetchError } = await supabase
    .from('loops')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single<Loop>()

  if (fetchError || !loop) {
    return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = stateTransitionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { to, reason } = parsed.data

  if (!validateTransition(loop.state, to)) {
    return NextResponse.json(
      {
        error: 'Invalid transition',
        allowed: VALID_TRANSITIONS[loop.state],
      },
      { status: 400 }
    )
  }

  // Special pre-condition: escalated requires a draft to exist
  if (to === 'escalated' && !loop.next_action) {
    return NextResponse.json(
      { error: 'Draft required before escalating' },
      { status: 400 }
    )
  }

  const updatePayload: Partial<Loop> & { state: LoopState } = {
    state: to,
    last_action_at: new Date().toISOString(),
  }

  // escalated → waiting: push expected_by 3 days forward, increment nudge_count
  if (loop.state === 'escalated' && to === 'waiting') {
    const newExpected = new Date()
    newExpected.setDate(newExpected.getDate() + 3)
    updatePayload.expected_by = newExpected.toISOString()
    updatePayload.nudge_count = (loop.nudge_count ?? 0) + 1
  }

  // → closed: clear next_action
  if (to === 'closed') {
    updatePayload.next_action = null
  }

  const { data: updated, error: updateError } = await supabase
    .from('loops')
    .update(updatePayload)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fire-and-forget push notifications
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (to === 'overdue') {
    fetch(`${baseUrl}/api/push/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        owner_id: user.id,
        title: 'Loop overdue',
        body: `${loop.counterparty} still hasn't replied — draft ready for review`,
        loop_id: id,
      }),
    }).catch(() => { /* fire-and-forget */ })
  } else if (to === 'closed') {
    fetch(`${baseUrl}/api/push/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        owner_id: user.id,
        title: 'Loop closed ✓',
        body: loop.description,
        loop_id: id,
      }),
    }).catch(() => { /* fire-and-forget */ })
  }

  return NextResponse.json({
    loop: updated,
    transition: {
      from: loop.state,
      to,
      reason: reason ?? getTransitionReason(loop.state, to),
    },
  })
}
