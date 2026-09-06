import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function refreshTokenIfNeeded(conn: { access_token: string; refresh_token: string; token_expiry: string | null; user_id: string }) {
  if (conn.token_expiry && new Date(conn.token_expiry) > new Date(Date.now() + 60_000)) {
    return conn.access_token
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  const db = serviceDb()
  await db.from('gmail_connections').update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq('user_id', conn.user_id)
  return data.access_token as string
}

function buildEmail(from: string, to: string, subject: string, body: string): string {
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')
  return Buffer.from(raw).toString('base64url')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const internalSecret = request.headers.get('x-internal-secret')
  const db = serviceDb()
  let ownerId: string

  if (internalSecret === process.env.MCP_SECRET) {
    // Agent-triggered: owner_id must be in body
    if (!body.owner_id) return NextResponse.json({ error: 'owner_id required for agent calls' }, { status: 400 })
    ownerId = body.owner_id
  } else {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    ownerId = user.id
  }

  // Load loop
  const { data: loop, error: loopErr } = await db.from('loops').select('*').eq('id', id).eq('owner_id', ownerId).single()
  if (loopErr || !loop) return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
  if (!loop.next_action) return NextResponse.json({ error: 'No draft to send' }, { status: 400 })

  // Load Gmail connection
  const { data: conn, error: connErr } = await db.from('gmail_connections').select('*').eq('user_id', ownerId).single()
  if (connErr || !conn) return NextResponse.json({ error: 'Gmail not connected. Connect Gmail first.' }, { status: 400 })

  // Refresh token if needed
  const accessToken = await refreshTokenIfNeeded(conn)

  // Build and send email
  const subject = `Following up: ${loop.description}`
  const rawEmail = buildEmail(
    conn.gmail_email,
    `${loop.counterparty} <${loop.counterparty}>`,
    subject,
    loop.next_action
  )

  const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawEmail }),
  })

  if (!gmailRes.ok) {
    const err = await gmailRes.json()
    console.error('Gmail send error:', err)
    return NextResponse.json({ error: 'Failed to send email via Gmail' }, { status: 500 })
  }

  const sent = await gmailRes.json()

  // Update loop: escalate, clear draft, increment nudge_count
  await db.from('loops').update({
    state: 'escalated',
    next_action: null,
    nudge_count: (loop.nudge_count ?? 0) + 1,
    last_action_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ sent: true, message_id: sent.id })
}
