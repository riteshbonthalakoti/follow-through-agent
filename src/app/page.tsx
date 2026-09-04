'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CircleDot, Clock, CheckCircle } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

const fadeDown = (delay = 0) => ({
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

const words1 = ['Stop', 'chasing.']
const words2 = ['Let', 'AI', 'do', 'it.']

const floatAnim = (delay = 0) => ({
  animate: { y: [0, -8, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
})

function MockCard({
  name,
  task,
  state,
  color,
  rotate,
  delay,
  floatDelay,
}: {
  name: string
  task: string
  state: string
  color: string
  rotate: string
  delay: number
  floatDelay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      style={{ transform: `rotate(${rotate})` }}
      className="relative"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
        className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 w-64 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-white text-sm font-medium">{name}</span>
        </div>
        <p className="text-zinc-400 text-xs">{task}</p>
        <div className="mt-3 text-[10px] text-zinc-600 uppercase tracking-wider">{state}</div>
      </motion.div>
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15), transparent)',
          }}
        />

        {/* Badge */}
        <motion.div {...fadeDown(0)} className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs">
            ✦ Built at Lyzr Builder Hour
          </span>
        </motion.div>

        {/* Headline */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 flex-wrap text-6xl font-bold mb-2">
            {words1.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="text-white"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <div className="flex justify-center gap-3 flex-wrap text-6xl font-bold">
            {words2.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.6)}
          className="text-xl text-zinc-400 max-w-lg text-center mb-8"
        >
          Follow-Through Agent tracks what others owe you and autonomously chases them — so nothing
          falls through the cracks.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.8)} className="flex gap-4 flex-wrap justify-center mb-16">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium transition-colors"
          >
            Get Started →
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-3 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition-colors"
          >
            See how it works
          </a>
        </motion.div>

        {/* Floating cards */}
        <div className="flex items-end justify-center gap-4 flex-wrap">
          <MockCard
            name="Rahul · Overdue 3 days"
            task="Send revised proposal PDF"
            state="● Overdue"
            color="bg-red-500"
            rotate="-2deg"
            delay={1.0}
            floatDelay={0}
          />
          <MockCard
            name="TechCorp HR · Due today"
            task="Share interview feedback"
            state="● Due today"
            color="bg-amber-500"
            rotate="0deg"
            delay={1.2}
            floatDelay={0.5}
          />
          <MockCard
            name="Priya · Waiting"
            task="Confirm meeting time"
            state="● Waiting"
            color="bg-blue-500"
            rotate="2deg"
            delay={1.4}
            floatDelay={1.0}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-white text-center mb-12"
        >
          Three steps. Zero chasing.
        </motion.h2>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <CircleDot className="w-6 h-6 text-violet-400" />,
              title: 'Log the loop',
              desc: 'Tell it who owes you what and by when. Voice, text, or email.',
            },
            {
              icon: <Clock className="w-6 h-6 text-amber-400" />,
              title: 'Agent monitors silently',
              desc: "It watches for replies. No noise until something's actually overdue.",
            },
            {
              icon: <CheckCircle className="w-6 h-6 text-green-400" />,
              title: 'You approve. It sends.',
              desc: 'Draft follow-ups land in your queue. One tap to chase.',
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6"
            >
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-zinc-500 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-[#0f0f0f] px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-0">
          {[
            { value: '10x', desc: 'more follow-through than manual tracking' },
            { value: '< 30s', desc: 'to log a new open loop' },
            { value: '0', desc: 'emails sent without your approval' },
          ].map((stat, i) => (
            <div key={stat.value} className="flex items-center">
              <div className="text-center px-10 py-6">
                <div className="text-4xl font-bold text-violet-400 mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.desc}</div>
              </div>
              {i < 2 && <div className="hidden md:block w-px h-12 bg-zinc-800" />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white">Your open loops are waiting.</h2>
          <p className="text-zinc-400 mt-2 mb-8">Start closing them today.</p>
          <Link
            href="/login"
            className="px-8 py-4 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium text-lg transition-colors"
          >
            Get Started Free →
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-8 px-6 flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
        <span className="text-violet-400 font-semibold">FollowThrough</span>
        <span className="text-zinc-600 text-sm mt-2 md:mt-0">
          Built with Lyzr · Supabase · Vercel
        </span>
      </footer>
    </main>
  )
}
