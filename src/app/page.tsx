'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CircleDot, Clock, CheckCircle } from 'lucide-react'

const stateStyles = {
  overdue: { dot: '#dc2626', bg: '#fee2e2', text: '#991b1b', label: 'Overdue' },
  due: { dot: '#d97706', bg: '#fef3c7', text: '#92400e', label: 'Due today' },
  waiting: { dot: '#2563eb', bg: '#dbeafe', text: '#1d4ed8', label: 'Waiting' },
}

function MockCard({
  state,
  counterparty,
  description,
  dueLabel,
  index,
  float,
}: {
  state: keyof typeof stateStyles
  counterparty: string
  description: string
  dueLabel: string
  index: number
  float?: boolean
}) {
  const s = stateStyles[state]
  const card = (
    <div
      className="bg-white rounded-xl p-4 w-72 border border-gray-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
          <span className="text-xs font-medium" style={{ color: s.text }}>
            {s.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">{counterparty}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-2">{description}</p>
      <p className="text-xs" style={{ color: s.text }}>
        {dueLabel}
      </p>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
      style={{ marginTop: index > 0 ? '-8px' : 0 }}
    >
      {float ? (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {card}
        </motion.div>
      ) : (
        card
      )}
    </motion.div>
  )
}

const steps = [
  {
    num: '01',
    icon: <CircleDot className="w-5 h-5 text-violet-600" />,
    title: 'Log the loop',
    body: 'Add who owes you what and by when — by voice, text, or connecting your Gmail.',
  },
  {
    num: '02',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    title: 'Agent monitors silently',
    body: 'It watches for replies. No noise unless something is genuinely overdue.',
  },
  {
    num: '03',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    title: 'You approve. It chases.',
    body: "A draft follow-up lands in your queue. One tap sends it. You're always in control.",
  },
]

const stats = [
  { value: '0', label: 'emails sent without your approval' },
  { value: '< 30s', label: 'to log a new open commitment' },
  { value: '100%', label: 'of follow-ups reviewed before sending' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      {/* HERO */}
      <section className="min-h-screen flex items-center px-6 py-20">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-violet-700 font-medium mb-4"
            >
              Trusted by freelancers &amp; job-seekers
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-gray-900 leading-tight"
            >
              The AI that tracks
              <br />
              what others owe you.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-500 max-w-md mt-4"
            >
              Follow-Through Agent monitors your open commitments, detects when someone goes quiet,
              and drafts the follow-up — all you do is approve.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex gap-3 flex-wrap mt-8"
            >
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition-colors"
              >
                Get Started Free
              </Link>
              <a
                href="#how-it-works"
                className="px-5 py-2.5 rounded-lg bg-white text-gray-700 border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                See how it works ↓
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-sm text-gray-400 mt-6"
            >
              ★★★★★&nbsp; Built at Lyzr Builder Hour · No card required
            </motion.p>
          </div>

          {/* Right — mock cards */}
          <div className="hidden md:flex flex-col items-start gap-0">
            <MockCard
              state="overdue"
              counterparty="Rahul"
              description="Send revised proposal PDF"
              dueLabel="Overdue 3 days"
              index={0}
              float
            />
            <MockCard
              state="due"
              counterparty="TechCorp HR"
              description="Share interview feedback"
              dueLabel="Due today"
              index={1}
            />
            <MockCard
              state="waiting"
              counterparty="Priya"
              description="Confirm next week's meeting"
              dueLabel="Due in 2 days"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Three steps. Zero chasing.
          </h2>
          <p className="text-gray-500 text-center mt-2 mb-12">
            No more mental overhead of remembering who owes you what.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-100 relative overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              >
                <div className="text-4xl font-bold text-violet-100 absolute top-4 left-4 select-none leading-none">
                  {step.num}
                </div>
                <div className="relative mt-6 mb-4">{step.icon}</div>
                <h3 className="text-gray-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {stats.map((stat) => (
            <div key={stat.value} className="text-center px-12 py-6">
              <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-violet-700 text-center">
        <h2 className="text-3xl font-bold text-white">Ready to close your open loops?</h2>
        <p className="text-violet-200 mt-2">Free to start. No credit card required.</p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-lg bg-white text-violet-700 font-medium hover:bg-violet-50 transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">FollowThrough</span>
          <span className="text-sm text-gray-400">Built with Lyzr · Supabase · Vercel</span>
        </div>
      </footer>
    </main>
  )
}
