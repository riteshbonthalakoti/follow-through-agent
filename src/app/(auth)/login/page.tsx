'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
        <div className="max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-5">
            <span className="text-[#22c55e] text-xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-[#f5f5f5] mb-2">Check your email</h1>
          <p className="text-[#71717a] text-sm">
            We sent a magic link to <span className="text-[#f5f5f5]">{email}</span>. Click it to sign in.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#7c3aed] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">FollowThrough</h1>
          <p className="text-[#71717a] text-sm mt-1">The AI that owns your open loops</p>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
          <h2 className="text-[#f5f5f5] font-medium text-base mb-4">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
            {error && <p className="text-[#ef4444] text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
