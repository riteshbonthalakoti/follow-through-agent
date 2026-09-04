import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { computeNewState, validateTransition } from '@/lib/loops/state-machine'
import type { Loop } from '@/types/loop'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let ownerId: string | null = null
  let isServiceRole = false

  if (authHeader === `Bearer ${serviceRoleKey}`) {
    isServiceRole = true
  } else {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    ownerId = user.id
  }

  // Use service role client for all DB ops so RLS is bypassed when needed
  const db = isServiceRole
    ? createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey!
      )
    : await createClient()

  let loopsQuery = db.from('loops').select('*').neq('state', 'closed')
  if (!isServiceRole && ownerId) {
    loopsQuery = loopsQuery.eq('owner_id', ownerId)
  }

  const { data: loops, error: fetchError } = await loopsQuery

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const now = new Date()
  const updated: Loop[] = []
  const errors: string[] = []

  for (const loop of (loops as Loop[]) ?? []) {
    const newState = computeNewState(loop, now)
    if (newState === loop.state) continue

    if (!validateTransition(loop.state, newState)) {
      errors.push(`Loop ${loop.id}: invalid computed transition ${loop.state} → ${newState}`)
      continue
    }

    const updatePayload: Partial<Loop> & { state: typeof newState } = {
      state: newState,
      last_action_at: now.toISOString(),
    }

    if (newState === 'overdue' && (loop.nudge_count ?? 0) === 0) {
      updatePayload.next_action = 'Auto-draft pending — agent will generate'
    }

    const { data: updatedLoop, error: updateError } = await db
      .from('loops')
      .update(updatePayload)
      .eq('id', loop.id)
      .select()
      .single()

    if (updateError) {
      errors.push(`Loop ${loop.id}: ${updateError.message}`)
    } else {
      updated.push(updatedLoop as Loop)
    }
  }

  return NextResponse.json({ scanned: loops?.length ?? 0, updated, errors })
}
