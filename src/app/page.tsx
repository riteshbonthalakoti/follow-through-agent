'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Zap, Mail, ShieldCheck, Download, Share, Plus, CheckCircle2 } from 'lucide-react'

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
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Live loop card mockup (pure CSS, cycles through states) ───────────────────

const LOOP_STATES = [
  { name: 'Rahul', desc: 'Send revised proposal PDF', when: '3 days overdue', tint: '#B3492B' },
  { name: 'TechCorp HR', desc: 'Share interview feedback', when: 'Due today', tint: '#8A6D1F' },
  { name: 'Priya', desc: "Confirm next week's meeting", when: 'Due in 2 days', tint: '#3D5A6C' },
] as const

function LoopCard() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % LOOP_STATES.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      <div className="rounded-[1.75rem] border border-[#1a1a1a]/10 bg-white shadow-[0_20px_60px_-15px_rgba(26,26,26,0.18)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1a1a1a]/8">
          <Image src="/logo.svg" alt="" width={18} height={18} />
          <span className="text-[13px] font-semibold text-[#1a1a1a] tracking-tight">FollowThrough</span>
          <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-[#1a1a1a]/40 uppercase tracking-wider">
            Live
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a1a1a]/40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1a1a1a]/60" />
            </span>
          </div>
        </div>

        <div className="p-5">
          {LOOP_STATES.map((l, i) => (
            <motion.div
              key={l.name}
              animate={{
                opacity: i === active ? 1 : 0,
                y: i === active ? 0 : 12,
                position: i === active ? 'relative' : 'absolute',
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              style={{ display: i === active ? 'block' : 'none' }}
            >
              <div className="rounded-2xl border border-[#1a1a1a]/8 bg-[#FAFAF8] p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#1a1a1a]">{l.name}</p>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-full"
                    style={{ color: l.tint, backgroundColor: `${l.tint}14` }}
                  >
                    {l.when}
                  </span>
                </div>
                <p className="text-[13px] text-[#1a1a1a]/50 leading-relaxed mb-4">{l.desc}</p>
                <div className="flex gap-2">
                  <div className="flex-1 h-9 rounded-xl bg-[#1a1a1a] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={12} /> Approve
                  </div>
                  <div className="h-9 px-4 rounded-xl border border-[#1a1a1a]/12 text-[11px] font-semibold text-[#1a1a1a]/60 flex items-center justify-center">
                    Edit
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="flex items-center gap-1.5 justify-center mt-5">
            {LOOP_STATES.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: i === active ? 18 : 6, backgroundColor: i === active ? '#1a1a1a' : 'rgba(26,26,26,0.14)' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bento features ──────────────────────────────────────────────────────────

const FEATURES = [
  { icon: ShieldCheck, title: 'Zero autonomous sends', body: 'Every follow-up is reviewed by you before it goes.' },
  { icon: Mail, title: 'Gmail auto-detect', body: 'Connect your inbox and watch open loops surface on their own.' },
  { icon: Zap, title: 'Instant nudge drafts', body: 'When someone goes quiet, AI drafts the follow-up in seconds.' },
  { icon: CheckCircle2, title: 'One-tap approve', body: 'Read it, edit if needed, send. Nothing leaves without you.' },
]

const STEPS = [
  { n: '01', title: 'Connect Gmail', body: 'Sign in once. FollowThrough starts reading your sent and received threads for open commitments.' },
  { n: '02', title: 'Loops surface', body: 'Every promise, proposal, and callback gets tracked automatically — no manual entry.' },
  { n: '03', title: 'Approve & send', body: 'When a loop goes quiet, review the AI draft and send it in one tap.' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { installPrompt, isIOS, isInstalled, install } = usePWA()

  return (
    <main className="bg-[#FAFAF8] overflow-x-hidden">

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-[#FAFAF8]/85 backdrop-blur-xl border-b border-[#1a1a1a]/8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <Image src="/logo.svg" alt="FollowThrough" width={22} height={22} />
            <span className="font-semibold text-[15px] text-[#1a1a1a] tracking-tight">FollowThrough</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#1a1a1a]/85 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1a1a1a]/12 text-[#1a1a1a]/70 text-xs font-medium mb-6">
              <Zap size={11} /> AI-powered follow-up tracking
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.75rem] sm:text-6xl font-medium text-[#1a1a1a] leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Nothing falls<br />through the cracks.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.55 }}
            className="mt-6 text-[17px] text-[#1a1a1a]/55 leading-relaxed max-w-md"
          >
            FollowThrough tracks what others owe you — proposals, callbacks, meetings. When someone ghosts you, AI drafts the nudge. You approve, it sends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5 }}
            className="mt-9 flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#1a1a1a]/85 transition-colors text-sm"
            >
              Start free <ArrowRight size={15} />
            </Link>

            {!isInstalled && (installPrompt || isIOS) && (
              <button
                onClick={isIOS ? undefined : install}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#1a1a1a]/15 text-[#1a1a1a]/80 font-semibold hover:bg-[#1a1a1a]/5 transition-colors text-sm"
              >
                {isIOS ? <><Share size={15} /> Add to Home Screen</> : <><Download size={15} /> Install App</>}
              </button>
            )}
          </motion.div>

          {isIOS && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-xs text-[#1a1a1a]/40 flex items-center gap-1.5">
              <Share size={11} /> Tap Share → Add to Home Screen for the full app experience
            </motion.p>
          )}

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md pt-8 border-t border-[#1a1a1a]/8"
          >
            {[
              { n: '23', label: 'avg open loops / person' },
              { n: '3×', label: 'faster follow-up' },
              { n: '0', label: 'sends without review' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-medium text-[#1a1a1a] tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>{s.n}</p>
                <p className="text-[11px] text-[#1a1a1a]/45 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — live loop mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <LoopCard />
        </motion.div>
      </section>

      {/* ── BENTO FEATURES ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <FadeUp className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-medium text-[#1a1a1a] tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            Built to stay out of your way
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <FadeUp key={title} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-[#1a1a1a]/8 p-7 h-full hover:border-[#1a1a1a]/20 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#FAFAF8] border border-[#1a1a1a]/8 flex items-center justify-center mb-5">
                  <Icon size={16} className="text-[#1a1a1a]/70" />
                </div>
                <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-1.5">{title}</h3>
                <p className="text-[13px] text-[#1a1a1a]/50 leading-relaxed">{body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="border-y border-[#1a1a1a]/8 bg-white py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium text-[#1a1a1a] tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
              How it works
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {STEPS.map((s, i) => (
              <FadeUp key={s.n} delay={i * 0.1}>
                <p
                  className="text-5xl sm:text-6xl font-medium text-[#1a1a1a]/10 mb-4 leading-none"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {s.n}
                </p>
                <h3 className="font-semibold text-[#1a1a1a] text-base mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#1a1a1a]/50 leading-relaxed max-w-xs">{s.body}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
        <FadeUp>
          <h2 className="text-4xl sm:text-5xl font-medium text-[#1a1a1a] mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your loops won&apos;t chase themselves.
          </h2>
          <p className="text-[#1a1a1a]/50 text-[15px] mb-9 max-w-sm mx-auto">Free forever · No card · Installs like a native app</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#1a1a1a]/85 transition-colors text-sm"
            >
              Get started free <ArrowRight size={15} />
            </Link>
            {!isInstalled && (installPrompt || isIOS) && (
              <button
                onClick={isIOS ? undefined : install}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-[#1a1a1a]/15 text-[#1a1a1a]/75 font-semibold hover:bg-[#1a1a1a]/5 transition-colors text-sm"
              >
                {isIOS ? <><Share size={14} /> Add to Home Screen</> : <><Download size={14} /> Install PWA</>}
              </button>
            )}
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a1a]/8 py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={18} height={18} />
            <span className="text-sm font-semibold text-[#1a1a1a]/80">FollowThrough</span>
          </div>
          <p className="text-xs text-[#1a1a1a]/40 text-center">
            Built at Lyzr Builder Hour ·{' '}
            <a href="https://github.com/riteshbonthalakoti/follow-through-agent" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#1a1a1a]/70">
              GitHub
            </a>
          </p>
          <Link href="/login" className="text-xs text-[#1a1a1a]/60 font-semibold hover:text-[#1a1a1a]">
            Sign in →
          </Link>
        </div>
      </footer>
    </main>
  )
}
