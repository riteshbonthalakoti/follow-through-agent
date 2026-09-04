import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { owner_id, title, body: notifBody, loop_id } = body as {
    owner_id: string
    title: string
    body: string
    loop_id?: string
  }

  if (!owner_id || !title || !notifBody) {
    return NextResponse.json({ error: 'Missing required fields: owner_id, title, body' }, { status: 400 })
  }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const { data: sub, error: fetchError } = await db
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', owner_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !sub) {
    return NextResponse.json({ sent: false, reason: 'no subscription' })
  }

  try {
    const webpush = (await import('web-push')).default
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const subscription = typeof sub.subscription === 'string'
      ? JSON.parse(sub.subscription)
      : sub.subscription

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body: notifBody, data: { loop_id } })
    )

    return NextResponse.json({ sent: true })
  } catch (err) {
    const error = err as Error
    return NextResponse.json({ sent: false, reason: error.message }, { status: 500 })
  }
}
