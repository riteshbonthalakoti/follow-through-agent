import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateFollowUpDraft } from '@/lib/lyzr/agent'
import type { Loop } from '@/types/loop'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { loop_id, agent_id } = await request.json()
  if (!loop_id || !agent_id) return NextResponse.json({ error: 'loop_id and agent_id required' }, { status: 400 })

  const db = serviceDb()
  const { data: loop, error } = await db.from('loops').select('*').eq('id', loop_id).eq('owner_id', user.id).single()
  if (error || !loop) return NextResponse.json({ error: 'Loop not found' }, { status: 404 })

  try {
    const draft = await generateFollowUpDraft(loop as Loop, agent_id)

    // Save draft back to loop
    await db.from('loops').update({ next_action: draft }).eq('id', loop_id)

    return NextResponse.json({ draft })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Draft generation failed' }, { status: 500 })
  }
}
