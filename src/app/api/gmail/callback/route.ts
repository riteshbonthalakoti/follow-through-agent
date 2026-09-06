import { NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const closePopup = (msg: string) => {
    const html = `<!doctype html><html><head><script>
      if(window.opener){window.opener.postMessage({type:${JSON.stringify(msg)}},${JSON.stringify(appUrl)});window.close();}
      else{window.location.href=${JSON.stringify(appUrl+'/dashboard')};}
    </script></head><body></body></html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  }

  if (error || !code || !userId) return closePopup('gmail-error')

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return closePopup('gmail-error')

  const tokens = await tokenRes.json()

  // Get Gmail email address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await profileRes.json()

  const db = serviceDb()
  await db.from('gmail_connections').upsert({
    user_id: userId,
    gmail_email: profile.email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return closePopup('gmail-connected')
}
