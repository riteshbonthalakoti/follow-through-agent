'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Zap, Mail, CheckCircle2, Download, Share, Plus } from 'lucide-react'

// ── Utilities ────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  return { installPrompt, isIOS, isInstalled, install }
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Mini loop preview card ─────────────────────────────────────────────────

const DEMO_LOOPS = [
  { state: 'overdue', name: 'Rahul', desc: 'Send revised proposal PDF', when: '3 days overdue', dot: 'bg-red-400', badge: 'bg-red-50 text-red-600 border-red-100' },
  { state: 'due',     name: 'TechCorp HR', desc: 'Share interview feedback', when: 'Due today',       dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  { state: 'waiting', name: 'Priya',       desc: "Confirm next week's meeting", when: 'Due in 2 days',  dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
] as const

function AppPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone shell */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-[#F7F6F3] px-6 pt-3 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-500">9:41</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-400" />
            <div className="w-1 h-1 rounded-full bg-slate-400" />
            <div className="w-1 h-1 rounded-full bg-slate-400" />
          </div>
        </div>

        {/* App nav */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={20} height={20} />
          <span className="text-xs font-bold text-slate-800">FollowThrough</span>
          <div className="ml-auto w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
            <Plus size={12} className="text-white" />
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-[#F7F6F3] px-4 py-3 grid grid-cols-3 gap-2">
          {[
            { n: 1, label: 'Overdue', c: 'text-red-600' },
            { n: 1, label: 'Due', c: 'text-amber-600' },
            { n: 1, label: 'Waiting', c: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm text-center">
              <p className={`text-lg font-bold ${s.c}`}>{s.n}</p>
              <p className="text-[9px] text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Loop cards */}
        <div className="px-4 py-3 space-y-2 pb-4">
          {DEMO_LOOPS.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${l.dot}`} />
              <div className="pl-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-800">{l.name}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${l.badge}`}>{l.when}</span>
                </div>
                <p className="text-[10px] text-slate-400">{l.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Glow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-violet-400/20 blur-2xl rounded-full" />
    </div>
  )
}

// ── Feature pillars ───────────────────────────────────────────────────────────

const FEATURES = [
  { icon: CheckCircle2, title: 'Zero autonomous sends', body: 'Every follow-up is reviewed by you before it goes. You\'re always in control.', color: 'bg-green-50 text-green-600' },
  { icon: Mail,         title: 'Gmail auto-detect',     body: 'Connect your inbox and watch open loops surface automatically using Gemini AI.', color: 'bg-blue-50 text-blue-600' },
  { icon: Zap,          title: 'Instant nudge drafts',  body: 'When someone goes quiet, AI drafts the perfect follow-up in seconds.', color: 'bg-violet-50 text-violet-600' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { installPrompt, isIOS, isInstalled, install } = usePWA()

  return (
    <main className="bg-[#F7F6F3] overflow-x-hidden">

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <Image src="/logo.svg" alt="FollowThrough" width={24} height={24} />
            <span className="font-bold text-sm text-slate-900 tracking-tight">FollowThrough</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold mb-5">
              <Zap size={11} /> AI-powered follow-up tracking
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="text-4xl sm:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Nothing falls<br />through the cracks.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-5 text-base text-slate-500 leading-relaxed max-w-md"
          >
            FollowThrough tracks what others owe you — proposals, callbacks, meetings. When someone ghosts you, AI drafts the nudge. You approve, it sends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors shadow-md text-sm"
            >
              Start free <ArrowRight size={15} />
            </Link>

            {/* PWA install button */}
            {!isInstalled && (installPrompt || isIOS) && (
              <button
                onClick={isIOS ? undefined : install}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-white hover:border-slate-300 transition-all text-sm"
              >
                {isIOS ? <><Share size={15} /> Add to Home Screen</> : <><Download size={15} /> Install App</>}
              </button>
            )}
          </motion.div>

          {isIOS && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-xs text-slate-400 flex items-center gap-1.5"
            >
              <Share size={11} /> Tap Share → Add to Home Screen for the full app experience
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-5 text-xs text-slate-400"
          >
            Free to use · No credit card · Works offline
          </motion.p>
        </div>

        {/* Right — app preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="flex justify-center"
        >
          <AppPreview />
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-8 px-4">
        <p className="text-sm text-slate-500 text-center max-w-lg mx-auto">
          The average professional has{' '}
          <span className="text-slate-900 font-semibold">23 open loops</span> at any time.
          Most go unresolved. FollowThrough fixes that.
        </p>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <FadeUp className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            How it works
          </h2>
          <p className="text-slate-400 mt-3 text-sm max-w-md mx-auto">Three things. That&apos;s the whole product.</p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body, color }, i) => (
            <FadeUp key={title} delay={i * 0.1}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── APPROVAL DEMO ───────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-20 px-4 sm:px-6">
        <FadeUp className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10 tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            Review, then send
          </h2>
          <div className="bg-[#F7F6F3] rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center">R</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Rahul · Proposal follow-up</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">3 days overdue</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-violet-500">
                <Zap size={10} /> AI draft
              </div>
            </div>
            {/* Draft */}
            <div className="px-5 py-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-700 font-mono leading-relaxed shadow-sm">
                Hi Rahul, just following up on the proposal I sent last week. Do you have any questions or would you like to set up a quick call to discuss?
              </div>
            </div>
            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm">
                <CheckCircle2 size={14} /> Approve &amp; Send
              </button>
              <button className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Edit</button>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <FadeUp>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your loops won&apos;t chase themselves.
          </h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Free forever · No card · Installs like a native app</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-lg text-sm"
            >
              Get started free <ArrowRight size={15} />
            </Link>
            {!isInstalled && (installPrompt || isIOS) && (
              <button
                onClick={isIOS ? undefined : install}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-white transition-all text-sm"
              >
                {isIOS ? <><Share size={14} /> Add to Home Screen</> : <><Download size={14} /> Install PWA</>}
              </button>
            )}
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={18} height={18} />
            <span className="text-sm font-bold text-slate-700">FollowThrough</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Built with Lyzr AI · Supabase · Gemini · Open source on{' '}
            <a href="https://github.com/riteshbonthalakoti/follow-through-agent" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-600">
              GitHub
            </a>
          </p>
          <Link href="/login" className="text-xs text-violet-600 font-semibold hover:text-violet-700">
            Sign in →
          </Link>
        </div>
      </footer>
    </main>
  )
}
