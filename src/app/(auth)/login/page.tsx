'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setError(error.message)
    } else {
      router.replace('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#fafaf9' }}>
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-violet-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            FollowThrough
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track what others owe you.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          {step === 'email' ? (
            <>
              <h2 className="text-gray-900 font-semibold text-base mb-1">Sign in</h2>
              <p className="text-gray-400 text-xs mb-4">We'll send a 6-digit code to your email.</p>
              <form onSubmit={sendOtp} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Send Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-gray-900 font-semibold text-base mb-1">Check your email</h2>
              <p className="text-gray-400 text-xs mb-4">
                Enter the 6-digit code sent to <span className="text-gray-700 font-medium">{email}</span>.
              </p>
              <form onSubmit={verifyOtp} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm text-center tracking-widest font-mono placeholder-gray-400 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-2.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(null) }}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          No password needed · No credit card required
        </p>
      </div>
    </main>
  )
}
