'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ArrowRight, Loader2, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const sb = createClient()
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const sb = createClient()
    const { error } = await sb.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) setError(error.message)
    else router.replace('/dashboard')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#F7F6F3] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-white border-r border-slate-200 p-12">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="FollowThrough" width={28} height={28} />
          <span className="font-bold text-slate-900 tracking-tight">FollowThrough</span>
        </div>

        <div className="space-y-8">
          {[
            { title: 'Never ghost a follow-up', body: 'Track every open loop — proposals, interviews, callbacks, IOUs.' },
            { title: 'AI drafts the nudge', body: 'When someone goes quiet, we write the message. You just approve it.' },
            { title: 'Gmail auto-detect', body: 'Connect your inbox and watch loops surface automatically.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-300">Free to use · No credit card required</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Image src="/logo.svg" alt="FollowThrough" width={26} height={26} />
            <span className="font-bold text-slate-900">FollowThrough</span>
          </div>

          {step === 'email' ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h1>
              <p className="text-sm text-slate-400 mb-8">We&apos;ll send a magic code — no password needed.</p>

              <form onSubmit={sendOtp} className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm"
                  />
                </div>

                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>Send magic code</span><ArrowRight size={14} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6">
                <ShieldCheck size={22} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Check your email</h1>
              <p className="text-sm text-slate-400 mb-8">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-slate-700">{email}</span>
              </p>

              <form onSubmit={verifyOtp} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="· · · · · ·"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-2xl text-slate-900 text-center tracking-[0.5em] font-mono placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm"
                />

                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : 'Sign In →'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(null) }}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
