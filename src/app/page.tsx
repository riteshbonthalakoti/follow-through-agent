'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// ── Shared animation helpers ──────────────────────────────────────────────────

const slideIn = (i: number) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, delay: i * 0.15 },
})

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay: i * 0.08 },
})

// ── Mini loop card used inside bento ─────────────────────────────────────────

const STATE = {
  overdue: { dot: '#dc2626', label: 'Overdue', text: '#991b1b', bg: '#fee2e2' },
  due: { dot: '#d97706', label: 'Due today', text: '#92400e', bg: '#fef3c7' },
  waiting: { dot: '#2563eb', label: 'Waiting', text: '#1d4ed8', bg: '#dbeafe' },
} as const

function MiniCard({
  state,
  name,
  desc,
  when,
}: {
  state: keyof typeof STATE
  name: string
  desc: string
  when: string
}) {
  const s = STATE[state]
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: s.dot }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{desc}</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: s.text, backgroundColor: s.bg }}
          >
            {s.label}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-400">{name}</span>
          <span className="text-xs" style={{ color: s.text }}>
            {when}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Hero right column — animated loop board mock ─────────────────────────────

function HeroVisual() {
  return (
    <div className="w-full h-[460px] lg:h-[560px] relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-900">My Loops</span>
        <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">3 need action</span>
      </div>

      {/* Loop rows */}
      {[
        { state: 'overdue' as const, name: 'Rahul', desc: 'Send revised proposal PDF', when: '3 days overdue' },
        { state: 'due' as const, name: 'TechCorp HR', desc: 'Share interview feedback', when: 'Due today' },
        { state: 'waiting' as const, name: 'Priya', desc: 'Confirm next week's meeting', when: 'Due in 2 days' },
        { state: 'waiting' as const, name: 'Accountant', desc: 'Send Q3 tax docs', when: 'Due in 5 days' },
      ].map((item, i) => (
        <MiniCard key={i} {...item} />
      ))}

      {/* Approval card */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Rahul — Overdue</span>
        </div>
        <p className="text-xs text-gray-600 font-mono leading-relaxed mb-3">
          Hi Rahul, following up on the proposal from last week. Could you let me know if you had a chance to review it?
        </p>
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 rounded-lg bg-violet-700 text-white text-xs font-medium">Approve & Send</button>
          <button className="flex-1 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium">Edit</button>
        </div>
      </div>
    </div>
  )
}

// ── Bento cards ───────────────────────────────────────────────────────────────

function BentoCard({
  children,
  className = '',
  violet = false,
}: {
  children: React.ReactNode
  className?: string
  violet?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${violet ? '' : 'bg-white border border-gray-200 shadow-sm'} ${className}`}
      style={violet ? { backgroundColor: '#f5f0ff' } : undefined}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: '#fafaf9' }} className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* Left */}
        <div className="flex flex-col justify-center px-8 lg:px-16 py-20 max-w-xl lg:max-w-none">
          <motion.p
            {...slideIn(0)}
            className="text-sm text-violet-700 font-medium tracking-wide uppercase"
          >
            Open loops cost you deals, jobs, and money.
          </motion.p>

          <motion.h1
            {...slideIn(1)}
            className="mt-4 text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Nothing falls
            <br />
            through the cracks.
          </motion.h1>

          <motion.p
            {...slideIn(2)}
            className="mt-6 max-w-md text-lg text-gray-500 leading-relaxed"
          >
            Follow-Through Agent tracks what others owe you. It detects when someone
            ghosts you, drafts the follow-up, and sends it only when you approve.
          </motion.p>

          <motion.div {...slideIn(3)} className="mt-8 flex gap-3 items-center flex-wrap">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition-colors"
            >
              Start tracking for free
            </Link>
            <a
              href="#demo"
              className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
            >
              See it live ↓
            </a>
          </motion.div>

          <motion.p {...slideIn(4)} className="mt-8 text-xs text-gray-400">
            Built at Lyzr Builder Hour · Powered by Supabase · Free to try
          </motion.p>
        </div>

        {/* Right — Spline */}
        <div className="hidden lg:flex items-center justify-center relative p-8">
          <HeroVisual />
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────── */}
      <section className="py-10 border-y border-gray-200 bg-white">
        <p className="text-base text-gray-500 text-center max-w-2xl mx-auto px-6">
          The average professional has{' '}
          <span className="text-gray-900 font-medium">23 open loops</span> at any time.
          Most go unresolved. This fixes that.
        </p>
      </section>

      {/* ── BENTO DEMO ───────────────────────────────────────────────────── */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-4xl font-bold text-gray-900 text-center"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            See it work.
          </h2>
          <p className="text-gray-500 text-center mt-2 mb-12">
            Four interactions. That&apos;s the whole product.
          </p>

          <div className="grid grid-cols-12 gap-4">

            {/* Card A — Loop board */}
            <motion.div {...fadeUp(0)} className="col-span-12 lg:col-span-7">
              <BentoCard className="min-h-[320px] flex flex-col">
                <h3 className="font-semibold text-gray-900">Your loops, organized</h3>
                <p className="text-sm text-gray-400 mt-1 mb-4">
                  Everything waiting on someone, in one place.
                </p>
                <div className="flex-1">
                  <MiniCard
                    state="overdue"
                    name="Rahul"
                    desc="Send revised proposal PDF"
                    when="Overdue 3 days"
                  />
                  <MiniCard
                    state="due"
                    name="TechCorp HR"
                    desc="Share interview feedback"
                    when="Due today"
                  />
                  <MiniCard
                    state="waiting"
                    name="Priya"
                    desc="Confirm next week's meeting"
                    when="Due in 2 days"
                  />
                </div>
              </BentoCard>
            </motion.div>

            {/* Card B — Approval queue */}
            <motion.div {...fadeUp(1)} className="col-span-12 lg:col-span-5">
              <BentoCard className="min-h-[320px] flex flex-col gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Approval queue</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Review the draft. Tap approve. Done.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Rahul — Overdue 3 days
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed font-mono border border-gray-200 flex-1">
                  Hi Rahul, following up on the proposal from last week. Could you let me
                  know if you had a chance to review it?
                </div>
                <div className="flex gap-2 mt-auto">
                  <button className="flex-1 py-2 rounded-lg bg-violet-700 text-white text-xs font-medium hover:bg-violet-800 transition-colors">
                    Approve &amp; Send
                  </button>
                  <button className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                </div>
              </BentoCard>
            </motion.div>

            {/* Card C — 100% */}
            <motion.div {...fadeUp(2)} className="col-span-12 lg:col-span-4">
              <BentoCard violet className="min-h-[200px] flex flex-col justify-between">
                <h3 className="font-semibold text-gray-900">Zero autonomous sends</h3>
                <div className="text-4xl font-bold text-violet-700 my-3">100%</div>
                <p className="text-sm text-gray-500">
                  Every follow-up is reviewed and approved by you first.
                </p>
              </BentoCard>
            </motion.div>

            {/* Card D — 30s */}
            <motion.div {...fadeUp(3)} className="col-span-12 lg:col-span-4">
              <BentoCard className="min-h-[200px] flex flex-col justify-between">
                <h3 className="font-semibold text-gray-900">Logs in &lt; 30 seconds</h3>
                <div className="text-4xl font-bold text-gray-900 my-3">30s</div>
                <p className="text-sm text-gray-500">
                  Add a loop by voice, text, or connected Gmail.
                </p>
              </BentoCard>
            </motion.div>

            {/* Card E — Lyzr */}
            <motion.div {...fadeUp(4)} className="col-span-12 lg:col-span-4">
              <BentoCard className="min-h-[200px] flex flex-col justify-between">
                <h3 className="font-semibold text-gray-900">Built on Lyzr AI</h3>
                <div className="text-2xl font-bold text-violet-700 my-3">Lyzr</div>
                <p className="text-sm text-gray-500">
                  Powered by{' '}
                  <span className="text-violet-700 font-semibold">Lyzr&apos;s</span>{' '}
                  agent platform for reliable, credit-efficient AI execution.
                </p>
              </BentoCard>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#fafaf9' }}>
        <h2
          className="text-4xl font-bold text-gray-900 text-center"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Your loops won&apos;t chase themselves.
        </h2>
        <p className="text-gray-500 text-center mt-3 max-w-lg mx-auto">
          Start free. No card required. Built for freelancers, job-seekers, and anyone
          with too many open commitments.
        </p>
        <div className="flex justify-center mt-8">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-violet-700 text-white font-medium hover:bg-violet-800 transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">FollowThrough</span>
          <span className="text-sm text-gray-400">
            Built at Lyzr Builder Hour · open source on{' '}
            <a
              href="https://github.com/riteshbonthalakoti/follow-through-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </main>
  )
}
