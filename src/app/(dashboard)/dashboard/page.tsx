'use client'

import { Suspense, useEffect, useState } from 'react'
import { LoopBoard } from '@/components/loops/LoopBoard'
import { TopBar } from '@/components/layout/TopBar'
import { AlertCircle, Clock, Hourglass, Zap } from 'lucide-react'

interface StatsData {
  overdue: number
  due: number
  waiting: number
  escalated: number
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${bg}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color} bg-opacity-10`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#f5f5f5] leading-none">{value}</p>
        <p className="text-xs text-[#71717a] mt-1">{label}</p>
      </div>
    </div>
  )
}

function StatsBar() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/loops')
      .then((r) => r.json())
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

  if (!stats) return null

  const urgent = stats.overdue + stats.due
  return (
    <div className="px-6 pt-5 pb-2">
      {urgent > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm font-medium">
          <AlertCircle size={15} />
          {urgent} loop{urgent !== 1 ? 's' : ''} need your attention today
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} color="text-[#ef4444]" bg="border-[#1a1a1a] bg-[#0f0f0f]" />
        <StatCard label="Due today" value={stats.due} icon={Clock} color="text-[#f59e0b]" bg="border-[#1a1a1a] bg-[#0f0f0f]" />
        <StatCard label="Waiting" value={stats.waiting} icon={Hourglass} color="text-[#3b82f6]" bg="border-[#1a1a1a] bg-[#0f0f0f]" />
        <StatCard label="Escalated" value={stats.escalated} icon={Zap} color="text-[#8b5cf6]" bg="border-[#1a1a1a] bg-[#0f0f0f]" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Loop Board" showAddLoop />
      <StatsBar />
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Suspense fallback={<p className="text-[#71717a] text-sm">Loading...</p>}>
          <LoopBoard />
        </Suspense>
      </div>
    </div>
  )
}
