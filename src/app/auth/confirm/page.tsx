'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)
      const hash = window.location.hash

      const code = params.get('code')
      const token_hash = params.get('token_hash')
      const type = params.get('type') as 'magiclink' | 'email' | null

      // Parse hash fragment (implicit flow: #access_token=...&refresh_token=...)
      const hashParams = new URLSearchParams(hash.replace('#', ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) { router.replace('/dashboard'); return }
        }

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type })
          if (!error) { router.replace('/dashboard'); return }
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (!error) { router.replace('/dashboard'); return }
        }
      } catch (_) {
        // fall through to error
      }

      router.replace('/login?error=auth_callback_failed')
    }

    handleCallback()
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafaf9' }}>
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </main>
  )
}
