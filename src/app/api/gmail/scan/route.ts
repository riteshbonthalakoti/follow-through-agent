import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getAccessToken, fetchRecentThreads } from '@/lib/gmail/client'
import { detectLoopsFromThreads } from '@/lib/gmail/detect-loops'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  // Internal secret allows server-side scan trigger
  const internalSecret = request.headers.get('x-internal-secret')
  const db = serviceDb()
  let userId: string | undefined

  if (internalSecret === process.env.MCP_SECRET) {
    // Look up user by email if provided
    const email = body.email as string | undefined
    if (email) {
      const { data: users } = await db.rpc('get_user_id_by_email', { email_input: email }).select()
      userId = (users as Array<{id: string}> | null)?.[0]?.id
      if (!userId) {
        // Try auth.users directly via service role
        const { data } = await db.from('gmail_connections').select('user_id').eq('gmail_email', email).single()
        userId = data?.user_id
      }
    }
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? (body.owner_id as string | undefined)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Gmail connection
  const { data: conn } = await db
    .from('gmail_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'Gmail not connected', code: 'gmail_not_connected' }, { status: 400 })
  }

  // Get already-processed thread IDs
  const { data: processed } = await db
    .from('gmail_processed_threads')
    .select('thread_id')
    .eq('user_id', userId)

  const processedIds = new Set((processed ?? []).map((r: { thread_id: string }) => r.thread_id))

  // Fetch Gmail threads
  const accessToken = await getAccessToken(conn)
  const allThreads = await fetchRecentThreads(accessToken, 30)
  const newThreads = allThreads.filter((t) => t && !processedIds.has(t.id))

  if (newThreads.length === 0) {
    return NextResponse.json({ loops_created: 0, message: 'No new threads to scan' })
  }

  // AI detection
  const detectedLoops = await detectLoopsFromThreads(newThreads as Parameters<typeof detectLoopsFromThreads>[0], conn.gmail_email)

  // Filter by confidence — lower threshold so more emails are caught
  const highConfidence = detectedLoops.filter((l) => l.confidence >= 0.3)

  // Create loops
  let created = 0
  for (const loop of highConfidence) {
    const dir = (loop as { direction?: string }).direction === 'outbound' ? 'outbound' : 'inbound'
    const { error } = await db.from('loops').insert({
      owner_id: userId,
      counterparty: loop.counterparty,
      description: loop.description,
      expected_by: loop.expected_by,
      direction: dir,
      source: 'email',
      source_ref: loop.thread_id,
      state: 'waiting',
      confidence: loop.confidence,
      nudge_count: 0,
    })
    if (!error) created++
  }

  // Mark all scanned threads as processed
  if (newThreads.length > 0) {
    await db.from('gmail_processed_threads').upsert(
      newThreads.filter(Boolean).map((t) => ({ user_id: userId, thread_id: t!.id })),
      { onConflict: 'user_id,thread_id' }
    )
  }

  // Update last_scanned_at
  await db.from('gmail_connections')
    .update({ last_scanned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return NextResponse.json({
    loops_created: created,
    threads_scanned: newThreads.length,
    detected: detectedLoops.length,
  })
}

export async function GET(request: NextRequest) {
  const internalSecret = request.headers.get('x-internal-secret')
  const db = serviceDb()

  if (internalSecret === process.env.MCP_SECRET) {
    // Return ALL connected Gmail accounts so the agent can discover them
    const { data: conns } = await db
      .from('gmail_connections')
      .select('gmail_email, user_id, last_scanned_at, created_at')
    return NextResponse.json({ connected: (conns ?? []).length > 0, connections: conns ?? [] })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conn } = await db
    .from('gmail_connections')
    .select('gmail_email, last_scanned_at, created_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ connected: !!conn, connection: conn ?? null })
}
