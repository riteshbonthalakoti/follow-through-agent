'use client'

import { Suspense, useEffect, useState } from 'react'
import { LoopBoard } from '@/components/loops/LoopBoard'
import { AddLoopDialog } from '@/components/loops/AddLoopDialog'
import { AlertTriangle, Clock, Hourglass, Zap, Plus } from 'lucide-react'

interface StatsData {
  overdue: number
  due: number
  waiting: number
  escalated: number
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border ${color} shadow-sm`}>
      <span className="text-xl font-bold text-slate-800 leading-none">{value}</span>
      <span className="text-xs text-slate-500 leading-tight">{label}</span>
    </div>
  )
}

function StatsRow({ onDialogOpen }: { onDialogOpen: () => void }) {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/loops')
      .then(r => r.json())
      .then(({ loops }) => {
        if (!loops) return
        setStats({
          overdue: loops.filter((l: { state: string }) => l.state === 'overdue').length,
          due: loops.filter((l: { state: string }) => l.state === 'due').length,
          waiting: loops.filter((l: { state: string }) => l.state === 'waiting').length,
          escalated: loops.filter((l: { state: string }) => l.state === 'escalated').length,
        })
      })
      .catch(() => {})
  }, [])

  const urgent = stats ? stats.overdue + stats.due : 0

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Open Loops</h1>
        {urgent > 0 && (
          <p className="text-sm text-amber-600 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle size={13} />
            {urgent} loop{urgent !== 1 ? 's' : ''} need attention today
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {stats && (
          <>
            <StatPill label="Overdue" value={stats.overdue} color="border-red-100" />
            <StatPill label="Due today" value={stats.due} color="border-amber-100" />
            <StatPill label="Waiting" value={stats.waiting} color="border-blue-100" />
            <StatPill label="Escalated" value={stats.escalated} color="border-violet-100" />
          </>
        )}
        <button
          onClick={onDialogOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add Loop
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <StatsRow onDialogOpen={() => setDialogOpen(true)} />
      <Suspense fallback={
        <div className="text-sm text-slate-400 py-12 text-center">Loading loops…</div>
      }>
        <LoopBoard externalDialogOpen={dialogOpen} onExternalDialogClose={() => setDialogOpen(false)} />
      </Suspense>
    </>
  )
}
