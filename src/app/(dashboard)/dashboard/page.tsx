'use client'

import { Suspense, useEffect, useState } from 'react'
import { LoopBoard } from '@/components/loops/LoopBoard'
import { AlertTriangle, Clock, Hourglass, Zap, CheckCircle2, LayoutList } from 'lucide-react'
import { isThisWeek } from 'date-fns'

interface StatsData {
  overdue: number
  due: number
  waiting: number
  escalated: number
  closedThisWeek: number
  totalOpen: number
}

const STATS_DEF = [
  { key: 'totalOpen',      label: 'Total Open',       icon: LayoutList,    ring: 'ring-slate-100',   num: 'text-slate-700',  bg: 'bg-slate-50',    sub: 'text-slate-400' },
  { key: 'overdue',        label: 'Overdue',          icon: AlertTriangle, ring: 'ring-red-100',     num: 'text-red-600',    bg: 'bg-red-50',      sub: 'text-red-400' },
  { key: 'due',            label: 'Due today',        icon: Clock,         ring: 'ring-amber-100',   num: 'text-amber-600',  bg: 'bg-amber-50',    sub: 'text-amber-400' },
  { key: 'closedThisWeek', label: 'Closed this week', icon: CheckCircle2,  ring: 'ring-green-100',   num: 'text-green-600',  bg: 'bg-green-50',    sub: 'text-green-400' },
] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/loops').then(r => r.json()).then(({ loops }) => {
      if (!loops) return
      setStats({
        overdue:        loops.filter((l: { state: string }) => l.state === 'overdue').length,
        due:            loops.filter((l: { state: string }) => l.state === 'due').length,
        waiting:        loops.filter((l: { state: string }) => l.state === 'waiting').length,
        escalated:      loops.filter((l: { state: string }) => l.state === 'escalated').length,
        closedThisWeek: loops.filter((l: { state: string; last_action_at: string }) =>
          l.state === 'closed' && isThisWeek(new Date(l.last_action_at))
        ).length,
        totalOpen: loops.filter((l: { state: string }) =>
          ['overdue', 'due', 'waiting', 'escalated'].includes(l.state)
        ).length,
      })
    }).catch(() => {})
  }, [])

  const urgent = stats ? stats.overdue + stats.due : 0
  const total  = stats?.totalOpen ?? 0

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Open Loops</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total > 0
              ? `${total} active loop${total !== 1 ? 's' : ''} tracked`
              : 'All loops resolved — nice work'}
          </p>
        </div>
        {urgent > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium shrink-0">
            <AlertTriangle size={13} />
            {urgent} need{urgent === 1 ? 's' : ''} attention today
          </div>
        )}
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          {STATS_DEF.map(({ key, label, icon: Icon, ring, num, bg, sub }) => (
            <div
              key={key}
              className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm ring-1 ${ring} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={sub} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${num} leading-none`}>{stats[key]}</p>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Board */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading loops…
        </div>
      }>
        <LoopBoard />
      </Suspense>
    </>
  )
}
