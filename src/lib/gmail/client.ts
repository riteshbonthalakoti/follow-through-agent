// Gmail API client with auto token refresh

interface GmailConnection {
  access_token: string
  refresh_token: string | null
  token_expiry: string | null
  user_id: string
}

async function refreshAccessToken(conn: GmailConnection): Promise<string> {
  if (!conn.refresh_token) throw new Error('No refresh token')

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
  return data.access_token
}

function isExpired(conn: GmailConnection): boolean {
  if (!conn.token_expiry) return false
  return new Date(conn.token_expiry) < new Date(Date.now() + 60_000)
}

export async function getAccessToken(conn: GmailConnection): Promise<string> {
  if (isExpired(conn)) return refreshAccessToken(conn)
  return conn.access_token
}

export async function fetchRecentThreads(accessToken: string, maxResults = 30) {
  // Fetch threads from last 14 days
  const after = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000)
  const query = `after:${after} -in:sent -in:spam -in:trash`

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!listRes.ok) return []
  const list = await listRes.json()
  if (!list.threads?.length) return []

  // Fetch thread details (parallel, limit to 20)
  const threads = await Promise.all(
    list.threads.slice(0, 20).map(async (t: { id: string }) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) return null
      const data = await res.json()
      const messages = data.messages ?? []
      const last = messages[messages.length - 1]
      const headers = last?.payload?.headers ?? []

      const getHeader = (name: string) =>
        headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

      const allParticipants = new Set<string>()
      messages.forEach((m: { payload?: { headers?: Array<{ name: string; value: string }> } }) => {
        const from = m.payload?.headers?.find((h: { name: string }) => h.name === 'From')?.value ?? ''
        if (from) allParticipants.add(from.replace(/<.*>/, '').trim())
      })

      return {
        id: t.id,
        subject: getHeader('Subject') || '(no subject)',
        snippet: last?.snippet ?? '',
        participants: Array.from(allParticipants).slice(0, 5),
        lastMessageDate: getHeader('Date'),
      }
    })
  )

  return threads.filter(Boolean)
}
