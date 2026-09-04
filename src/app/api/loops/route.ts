import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLoopSchema } from '@/lib/loops/schema'
import type { LoopState } from '@/types/loop'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') as LoopState | null

  let query = supabase
    .from('loops')
    .select('*')
    .eq('owner_id', user.id)
    .order('expected_by', { ascending: true })

  if (state) {
    query = query.eq('state', state)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ loops: data ?? [], count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createLoopSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const now = new Date()
  const expectedBy = new Date(parsed.data.expected_by)
  if (expectedBy < now) {
    // Warn but allow — expected for email ingestion of past-due items
    console.warn(`[loops/POST] expected_by in the past: ${parsed.data.expected_by}`)
  }

  const { data, error } = await supabase
    .from('loops')
    .insert({
      ...parsed.data,
      owner_id: user.id,
      state: 'waiting',
      nudge_count: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ loop: data }, { status: 201 })
}
