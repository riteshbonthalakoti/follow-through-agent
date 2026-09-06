'use client'

import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect, useState } from 'react'
import {
  ArrowRight, Zap, Mail, Download, Share, CheckCircle2,
  Menu, X, Sparkles, Send,
} from 'lucide-react'

// ── PWA install hook ─────────────────────────────────────────────────────────

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

// ── Reveal primitives ────────────────────────────────────────────────────────

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

function SlideIn({ children, delay = 0, className = '', from = -32 }: { children: React.ReactNode; delay?: number; className?: string; from?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: from }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Counter({ to, suffix = '', duration = 1.2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(to); return }
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * to))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>
}

// ── Scroll progress bar ──────────────────────────────────────────────────────

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#1a1a1a] origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

// ── Live loop card mockup (glassmorphism, cycles through states) ────────────

const LOOP_STATES = [
  { name: 'Rahul', desc: 'Send revised proposal PDF', when: '3 days overdue', tint: '#C0392B' },
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
      {/* blurred gradient blob behind card */}
      <div
        className="absolute -inset-16 -z-10 opacity-[0.18] blur-3xl"
        style={{ background: 'radial-gradient(circle at 30% 20%, #E8A54B, transparent 55%), radial-gradient(circle at 70% 80%, #7C5CFC, transparent 55%)' }}
      />

      <div className="glass-card rounded-[1.75rem] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/40">
          <Image src="/logo.svg" alt="" width={18} height={18} />
          <span className="text-[13px] font-semibold text-[#1a1a1a] tracking-tight">FollowThrough</span>
          <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-[#1a1a1a]/40 uppercase tracking-wider">
            Live
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C5CFC]/50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#7C5CFC]" />
            </span>
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={LOOP_STATES[active].name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/70 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#1a1a1a]">{LOOP_STATES[active].name}</p>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-full"
                    style={{ color: LOOP_STATES[active].tint, backgroundColor: `${LOOP_STATES[active].tint}14` }}
                  >
                    {LOOP_STATES[active].when}
                  </span>
                </div>
                <p className="text-[13px] text-[#1a1a1a]/50 leading-relaxed mb-4">{LOOP_STATES[active].desc}</p>
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
          </AnimatePresence>

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

      {/* floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="glass-card mt-4 mx-auto w-fit rounded-full px-4 py-2 flex items-center gap-2 text-[11px] font-medium text-[#1a1a1a]/70"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" />
        Gmail connected · 3 new loops detected
      </motion.div>
    </div>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

const PAIN_POINTS = [
  { n: '01', title: 'It lives in your head', body: 'Every promise, every "I\'ll follow up next week" sits as mental load — until it slips.' },
  { n: '02', title: "Your inbox doesn't care", body: 'Email shows you messages, not obligations. Nothing tells you what\'s actually still open.' },
  { n: '03', title: 'You forget. They forget.', body: 'Deals go cold, invoices sit unpaid, opportunities quietly vanish — one missed nudge at a time.' },
]

const LOGO_NAMES = ['Northwind Studio', 'Arclight Consulting', 'Fieldnote Labs', 'Basecamp Collective', 'Harbor & Co.']

export default function LandingPage() {
  const { installPrompt, isIOS, isInstalled, install } = usePWA()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const headlineY = useTransform(heroProgress, [0, 1], [0, -80])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="bg-[#F8F7F4] overflow-x-hidden">
      <ScrollProgressBar />

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-[#1a1a1a]/8' : 'bg-transparent border-b border-transparent'}`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <Image src="/logo.svg" alt="FollowThrough" width={22} height={22} />
            <span className="font-semibold text-[15px] text-[#1a1a1a] tracking-tight">FollowThrough</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href.slice(1))}
                className="text-sm font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/login" className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#1a1a1a]/85 transition-colors">
              Get started free
            </Link>
          </div>

          <button className="md:hidden p-2 text-[#1a1a1a]" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#F8F7F4] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16">
              <span className="font-semibold text-[15px] text-[#1a1a1a]">FollowThrough</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2 text-[#1a1a1a]">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {NAV_LINKS.map(l => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href.slice(1))}
                  className="text-2xl font-medium text-[#1a1a1a]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {l.label}
                </button>
              ))}
              <Link href="/login" className="mt-4 px-8 py-3.5 rounded-xl bg-[#1a1a1a] text-white font-semibold text-sm">
                Get started free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 min-h-[92vh] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1a1a1a]/12 text-[#1a1a1a]/70 text-xs font-medium mb-6">
              Built at Lyzr Builder Hour <Zap size={11} />
            </span>
          </motion.div>

          <motion.div style={{ y: headlineY }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="text-[2.75rem] sm:text-7xl font-bold text-[#1a1a1a] leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Stop chasing.<br />Start closing.
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.55 }}
            className="mt-6 text-[18px] text-[#6B7280] leading-[1.7] max-w-md"
          >
            FollowThrough tracks every commitment others owe you — and follows up automatically until it&apos;s done.
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
              Get started free <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => scrollTo('features')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#1a1a1a]/20 text-[#1a1a1a] font-semibold hover:bg-[#1a1a1a]/5 transition-colors text-sm"
            >
              See it in action <ArrowRight size={15} />
            </button>

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

          {/* Social proof chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-12 flex flex-wrap gap-2.5"
          >
            {['500+ loops closed', '2 min setup', 'Zero missed follow-ups'].map(chip => (
              <span key={chip} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#1a1a1a]/8 text-[12px] font-medium text-[#1a1a1a]/65">
                <CheckCircle2 size={12} className="text-[#27AE60]" /> {chip}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — glassmorphism loop mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <LoopCard />
        </motion.div>
      </section>

      {/* ── LOGO BAR ───────────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-8 border-y border-[#1a1a1a]/8">
        <FadeUp className="max-w-6xl mx-auto text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/40 mb-7">
            Trusted by indie builders, freelancers, and founders
          </p>
          <div
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}
          >
            {LOGO_NAMES.map(name => (
              <span key={name} className="text-[15px] font-semibold text-[#1a1a1a]/25 tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                {name}
              </span>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── PROBLEM SECTION ────────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] text-white py-24 sm:py-32 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-16 max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.1]" style={{ fontFamily: 'var(--font-playfair)' }}>
              The invisible ledger everyone ignores
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-20">
            {PAIN_POINTS.map((p, i) => (
              <FadeUp key={p.n} delay={i * 0.1}>
                <p className="text-sm font-medium text-white/30 mb-3">{p.n}</p>
                <h3 className="font-semibold text-lg mb-2.5">{p.title}</h3>
                <p className="text-[14px] text-white/50 leading-[1.7] max-w-xs">{p.body}</p>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.2} className="border-t border-white/10 pt-14">
            <p
              className="text-2xl sm:text-4xl italic text-white/90 leading-snug max-w-3xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              &ldquo;The follow-up you didn&apos;t send cost you the deal.&rdquo;
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <FadeUp className="mb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/40 mb-3">What it does</p>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#1a1a1a] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your AI chief of follow-through
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* Card 1 — large left: email thread mockup */}
          <SlideIn from={-32} delay={0}>
            <div className="bg-white rounded-2xl border border-[#1a1a1a]/8 p-7 h-full hover:shadow-[0_20px_40px_-20px_rgba(26,26,26,0.15)] transition-shadow">
              <h3 className="font-semibold text-[#1a1a1a] text-[17px] mb-1.5">Detects open loops from Gmail</h3>
              <p className="text-[13px] text-[#1a1a1a]/50 leading-relaxed mb-6 max-w-sm">
                It reads the intent of your threads, not just the words — and knows a promise when it sees one.
              </p>
              <div className="rounded-xl border border-[#1a1a1a]/8 bg-[#F8F7F4] overflow-hidden">
                {[
                  { from: 'Rahul Sharma', subject: 'Re: Proposal for Q3 rollout', snippet: "Sounds good, I'll send the revised PDF by Friday...", time: '3d' },
                  { from: 'You', subject: 'Re: Proposal for Q3 rollout', snippet: 'Great, looking forward to it!', time: '3d' },
                ].map((m, i) => (
                  <div key={i} className={`px-4 py-3 flex gap-3 ${i === 0 ? 'border-b border-[#1a1a1a]/6' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center text-[10px] font-semibold text-[#1a1a1a]/60 shrink-0">
                      {m.from[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-[#1a1a1a] truncate">{m.from}</p>
                        <span className="text-[10px] text-[#1a1a1a]/35 shrink-0">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-[#1a1a1a]/45 truncate">{m.snippet}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 bg-[#7C5CFC]/8 flex items-center gap-2">
                  <Sparkles size={11} className="text-[#7C5CFC]" />
                  <span className="text-[11px] font-medium text-[#7C5CFC]">Open loop detected — due Friday</span>
                </div>
              </div>
            </div>
          </SlideIn>

          <div className="grid grid-rows-2 gap-4">
            {/* Card 2 — confidence bar */}
            <SlideIn from={32} delay={0.1}>
              <UrgencyCard />
            </SlideIn>

            {/* Card 3 — template buttons */}
            <SlideIn from={32} delay={0.2}>
              <div className="bg-white rounded-2xl border border-[#1a1a1a]/8 p-6 h-full hover:shadow-[0_20px_40px_-20px_rgba(26,26,26,0.15)] transition-shadow">
                <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-1.5">Drafts follow-ups for approval</h3>
                <p className="text-[12px] text-[#1a1a1a]/50 leading-relaxed mb-4">Pick a tone, edit if needed, send.</p>
                <div className="flex flex-wrap gap-2">
                  {['Friendly nudge', 'Direct ask', 'Final reminder'].map(t => (
                    <span key={t} className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[#1a1a1a]/10 text-[#1a1a1a]/65 bg-[#F8F7F4]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </SlideIn>
          </div>

          {/* Card 4 — full width flow diagram */}
          <SlideIn from={0} delay={0.3} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#1a1a1a]/8 p-7 hover:shadow-[0_20px_40px_-20px_rgba(26,26,26,0.15)] transition-shadow">
              <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-6">Human in the loop, always</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                {['Detect', 'Score', 'Draft', 'You Approve', 'Send'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2 w-full sm:w-auto">
                    <div className={`flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl text-[12px] font-semibold ${step === 'You Approve' ? 'bg-[#1a1a1a] text-white' : 'bg-[#F8F7F4] border border-[#1a1a1a]/8 text-[#1a1a1a]/70'}`}>
                      {step}
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight size={14} className="text-[#1a1a1a]/25 rotate-90 sm:rotate-0 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* ── HOW IT WORKS (alternating) ─────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-[#1a1a1a]/8 bg-white py-24 sm:py-32 px-5 sm:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-20">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/40 mb-3">The process</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-[#1a1a1a] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-playfair)' }}>
              How it works
            </h2>
          </FadeUp>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <span
                className="hidden lg:block absolute -left-8 -top-16 text-[200px] leading-none font-bold text-[#1a1a1a] pointer-events-none select-none"
                style={{ fontFamily: 'var(--font-playfair)', opacity: 0.05 }}
              >01</span>
              <SlideIn from={-32}>
                <h3 className="font-semibold text-[#1a1a1a] text-2xl mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Connect Gmail</h3>
                <p className="text-[15px] text-[#1a1a1a]/55 leading-[1.7] max-w-md">30 seconds, one click. FollowThrough starts reading your sent and received threads for open commitments — read-only, nothing sends without you.</p>
              </SlideIn>
              <SlideIn from={32} delay={0.1}>
                <div className="bg-[#F8F7F4] rounded-2xl border border-[#1a1a1a]/8 p-8 flex items-center justify-center">
                  <button className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white border border-[#1a1a1a]/10 shadow-sm text-sm font-semibold text-[#1a1a1a]">
                    <Mail size={16} className="text-[#C0392B]" /> Connect Gmail
                    <CheckCircle2 size={14} className="text-[#27AE60]" />
                  </button>
                </div>
              </SlideIn>
            </div>

            {/* Step 2 */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <span
                className="hidden lg:block absolute -right-8 -top-16 text-[200px] leading-none font-bold text-[#1a1a1a] pointer-events-none select-none lg:right-0"
                style={{ fontFamily: 'var(--font-playfair)', opacity: 0.05 }}
              >02</span>
              <SlideIn from={-32} className="lg:order-2">
                <h3 className="font-semibold text-[#1a1a1a] text-2xl mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Agent detects commitments</h3>
                <p className="text-[15px] text-[#1a1a1a]/55 leading-[1.7] max-w-md">Every promise gets scored for urgency and surfaced as a loop card — no manual tagging, no spreadsheets.</p>
              </SlideIn>
              <SlideIn from={32} delay={0.1} className="lg:order-1">
                <div className="bg-[#F8F7F4] rounded-2xl border border-[#1a1a1a]/8 p-8">
                  <div className="bg-white rounded-xl border border-[#1a1a1a]/8 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">Rahul · Proposal follow-up</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B]">92% urgent</span>
                    </div>
                    <UrgencyBar value={92} />
                  </div>
                </div>
              </SlideIn>
            </div>

            {/* Step 3 */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <span
                className="hidden lg:block absolute -left-8 -top-16 text-[200px] leading-none font-bold text-[#1a1a1a] pointer-events-none select-none"
                style={{ fontFamily: 'var(--font-playfair)', opacity: 0.05 }}
              >03</span>
              <SlideIn from={-32}>
                <h3 className="font-semibold text-[#1a1a1a] text-2xl mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Approve, edit, or dismiss</h3>
                <p className="text-[15px] text-[#1a1a1a]/55 leading-[1.7] max-w-md">Review the AI draft, tweak the tone if you want, and send in one tap. Or dismiss it — you&apos;re always in control.</p>
              </SlideIn>
              <SlideIn from={32} delay={0.1}>
                <div className="bg-[#F8F7F4] rounded-2xl border border-[#1a1a1a]/8 p-8 flex items-center justify-center">
                  <ApproveButton />
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ──────────────────────────────────────────────── */}
      <section className="py-24 sm:py-28 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {[
            { to: 2400, suffix: '+', label: 'loops tracked' },
            { to: 94, suffix: '%', label: 'follow-up rate' },
            { to: 8, suffix: ' sec', label: 'to approve' },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.1}>
              <p className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-playfair)' }}>
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="text-[13px] text-[#1a1a1a]/45 mt-2">{s.label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] py-24 sm:py-32 px-5 sm:px-8 text-center">
        <FadeUp>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-5 tracking-[-0.02em] leading-[1.1]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your open loops won&apos;t close themselves.
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-4 px-9 py-4 rounded-xl bg-white text-[#1a1a1a] font-semibold hover:bg-white/90 transition-colors text-[15px]"
          >
            Start for free — no credit card <ArrowRight size={16} />
          </Link>
          <p className="text-white/40 text-[13px] mt-6">PWA · Works on any device · Gmail connected in 30 seconds</p>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer id="pricing" className="py-12 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={20} height={20} />
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">FollowThrough</p>
              <p className="text-[11px] text-[#1a1a1a]/40">Nothing falls through the cracks.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[13px] font-medium text-[#1a1a1a]/50">
            <Link href="/privacy" className="hover:text-[#1a1a1a]">Privacy</Link>
            <a href="https://github.com/riteshbonthalakoti/follow-through-agent" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a1a1a]">GitHub</a>
            <span>Built with Lyzr</span>
          </div>
          <p className="text-[12px] text-[#1a1a1a]/35">© {new Date().getFullYear()} FollowThrough</p>
        </div>
      </footer>
    </main>
  )
}

// ── Small composed pieces ────────────────────────────────────────────────────

function UrgencyBar({ value }: { value: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} className="h-1.5 rounded-full bg-[#1a1a1a]/8 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-[#C0392B]"
        initial={{ width: '0%' }}
        animate={{ width: inView ? `${value}%` : '0%' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </div>
  )
}

function UrgencyCard() {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    const target = 78
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1200)
      setValue(Math.round(t * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-[#1a1a1a]/8 p-6 h-full hover:shadow-[0_20px_40px_-20px_rgba(26,26,26,0.15)] transition-shadow">
      <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-1.5">Scores urgency automatically</h3>
      <p className="text-[12px] text-[#1a1a1a]/50 leading-relaxed mb-4">Confidence score based on tone, deadline, and silence.</p>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-[#1a1a1a]/50">Confidence</span>
        <span className="text-[13px] font-bold text-[#7C5CFC]">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a1a1a]/8 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#7C5CFC]"
          initial={{ width: '0%' }}
          animate={{ width: inView ? '78%' : '0%' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

function ApproveButton() {
  const [approved, setApproved] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setApproved(a => !a), 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <motion.div
      animate={{ scale: approved ? 0.97 : 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors duration-500 ${approved ? 'bg-[#27AE60] text-white' : 'bg-[#1a1a1a] text-white'}`}
    >
      {approved ? <><CheckCircle2 size={16} /> Sent</> : <><Send size={16} /> Approve &amp; Send</>}
    </motion.div>
  )
}
