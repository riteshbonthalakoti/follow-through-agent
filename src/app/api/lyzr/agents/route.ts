import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listLyzrAgents } from '@/lib/lyzr/agent'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const agents = await listLyzrAgents()
    return NextResponse.json({ agents })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to list agents' }, { status: 500 })
  }
}
