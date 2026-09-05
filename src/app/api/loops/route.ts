import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createLoopSchema } from '@/lib/loops/schema'
import type { LoopState } from '@/types/loop'

// Resolve owner_id: accept explicit owner_id param (for API/agent calls) or fall back to session user
async function resolveOwnerId(request: NextRequest, body?: Record<string, unknown>): Promise<{ owner_id: string; db: ReturnType<typeof createServiceClient> } | null> {
  const { searchParams } = new URL(request.url)
  const paramId = searchParams.get('owner_id') ?? (body?.owner_id as string | undefined)

  if (paramId) {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    return { owner_id: paramId, db }
  }

  // Fall back to session auth for dashboard calls
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { owner_id: user.id, db: supabase as unknown as ReturnType<typeof createServiceClient> }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveOwnerId(request)
  if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { owner_id, db } = resolved

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') as LoopState | null

  let query = db.from('loops').select('*').eq('owner_id', owner_id).order('expected_by', { ascending: true })
  if (state) query = query.eq('state', state)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ loops: data ?? [], count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const resolved = await resolveOwnerId(request, body)
  if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { owner_id, db } = resolved

  // Accept both field name conventions from AI agents
  const normalised = {
    ...body,
    description: body.description ?? body.commitment ?? body.desc,
    expected_by: body.expected_by ?? body.due_date ?? body.dueDate,
    owner_id,
  }

  const parsed = createLoopSchema.safeParse(normalised)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await db.from('loops').insert({
    ...parsed.data,
    owner_id,
    state: 'waiting',
    nudge_count: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ loop: data }, { status: 201 })
}
