import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  description:  z.string().min(1).max(500).optional(),
  counterparty: z.string().min(1).max(200).optional(),
  expected_by:  z.string().datetime().optional(),
  next_action:  z.string().nullable().optional(),
  source_ref:   z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
  }

  return NextResponse.json({ loop: data })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('loops')
    .update({
      ...parsed.data,
      last_action_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Loop not found' }, { status: error ? 500 : 404 })
  }

  return NextResponse.json({ loop: data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete: set state to 'closed'
  const { error } = await supabase
    .from('loops')
    .update({ state: 'closed', last_action_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
