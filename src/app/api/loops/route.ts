import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createLoopSchema } from '@/lib/loops/schema'
import type { LoopState } from '@/types/loop'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function resolveOwnerId(request: NextRequest, body?: Record<string, unknown>): Promise<string | null> {
  const { searchParams } = new URL(request.url)
  const paramId = searchParams.get('owner_id') ?? (body?.owner_id as string | undefined)
  if (paramId) return paramId

  // Fall back to session user
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function GET(request: NextRequest) {
  const owner_id = await resolveOwnerId(request)
  if (!owner_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') as LoopState | null
  const db = serviceDb()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.from('loops').select('*').eq('owner_id', owner_id).order('expected_by', { ascending: true })
  if (state) query = query.eq('state', state)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ loops: data ?? [], count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const owner_id = await resolveOwnerId(request, body)
  if (!owner_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const normalised = {
    ...body,
    description: body.description ?? body.commitment ?? body.desc,
    expected_by: body.expected_by ?? body.due_date ?? body.dueDate,
    owner_id,
  }

  const parsed = createLoopSchema.safeParse(normalised)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const db = serviceDb()
  const { data, error } = await db.from('loops').insert({
    owner_id,
    counterparty: parsed.data.counterparty,
    description: parsed.data.description,
    expected_by: parsed.data.expected_by,
    direction: parsed.data.direction ?? 'outbound',
    source: parsed.data.source ?? 'manual',
    state: 'waiting',
    nudge_count: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ loop: data }, { status: 201 })
}
