'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, CheckCircle2, Trash2, Sparkles, MoreHorizontal, Send } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Loop } from '@/types/loop'

export function computePriority(loop: Loop): number {
  const daysOverdue = Math.max(0, differenceInDays(new Date(), new Date(loop.expected_by)))
  return (Math.min(daysOverdue, 14) / 14) * 0.4
    + (1 - (loop.confidence ?? 0.5)) * 0.3
    + (Math.min(loop.nudge_count ?? 0, 5) / 5) * 0.3
}

const STATE_CONFIG: Record<string, { bar: string; badge: string; badgeText: string }> = {
  waiting:   { bar: 'bg-blue-400',    badge: 'bg-blue-50 border-blue-100',   badgeText: 'text-blue-600' },
  due:       { bar: 'bg-amber-400',   badge: 'bg-amber-50 border-amber-100', badgeText: 'text-amber-600' },
  overdue:   { bar: 'bg-red-400',     badge: 'bg-red-50 border-red-100',     badgeText: 'text-red-500' },
  escalated: { bar: 'bg-[#7C5CFC]',  badge: 'bg-[#7C5CFC]/8 border-[#7C5CFC]/15', badgeText: 'text-[#7C5CFC]' },
  closed:    { bar: 'bg-green-400',   badge: 'bg-green-50 border-green-100', badgeText: 'text-green-600' },
}
const STATE_LABELS: Record<string, string> = {
  waiting: 'Waiting', due: 'Due today', overdue: 'Overdue', escalated: 'Escalated', closed: 'Closed',
}

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-600',
  'bg-sky-100 text-sky-600',
  'bg-violet-100 text-violet-600',
]

function dueDateLabel(d: string) {
  const date = new Date(d)
  if (isPast(date) && !isToday(date)) return `${formatDistanceToNow(date)} overdue`
  if (isToday(date)) return 'Due today'
  if (isTomorrow(date)) return 'Due tomorrow'
  return `Due ${formatDistanceToNow(date, { addSuffix: true })}`
}
function dueDateColor(d: string) {
  const date = new Date(d)
  if (isPast(date) && !isToday(date)) return 'text-red-500'
  if (isToday(date) || isTomorrow(date)) return 'text-amber-500'
  return 'text-slate-400'
}

interface LoopCardProps {
  loop: Loop
  onUpdate: (u: Loop) => void
  onClose: (id: string) => void
}

export function LoopCard({ loop, onUpdate, onClose }: LoopCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [drafting, setDrafting] = useState(false)

  const cfg = STATE_CONFIG[loop.state] ?? STATE_CONFIG.waiting
  const avatarColor = AVATAR_COLORS[loop.counterparty.charCodeAt(0) % AVATAR_COLORS.length]
  const priority = computePriority(loop)
  const isHot = priority > 0.7

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setClosing(true)
    try {
      const res = await fetch(`/api/loops/${loop.id}/state`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'closed' }),
      })
      if (!res.ok) throw new Error()
      onClose(loop.id)
      toast.success('Loop closed')
    } catch { toast.error('Failed to close loop') }
    finally { setClosing(false) }
  }

  const handleDraft = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setDrafting(true)
    try {
      const res = await fetch('/api/lyzr/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loop_id: loop.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate({ ...loop, next_action: data.draft })
      toast.success('Draft ready — check Approvals')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Draft failed') }
    finally { setDrafting(false) }
  }

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden',
        'hover:shadow-md hover:border-slate-300/80 transition-all duration-150',
        closing && 'opacity-40 pointer-events-none scale-95',
      )}
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl', cfg.bar)} />

      <div className="pl-4 pr-3 pt-3.5 pb-3">
        {/* Header row */}
        <div className="flex items-center gap-2.5 mb-2">
          {/* Avatar */}
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', avatarColor)}>
            {loop.counterparty[0]?.toUpperCase() ?? '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{loop.counterparty}</p>
              {isHot && <span className="text-xs leading-none" title="High priority">🔥</span>}
            </div>
            {/* Direction pill */}
            <div className="flex items-center gap-1 mt-0.5">
              {loop.direction === 'inbound'
                ? <><ArrowDownLeft size={10} className="text-blue-400" /><span className="text-[10px] text-slate-400">They owe you</span></>
                : <><ArrowUpRight size={10} className="text-amber-400" /><span className="text-[10px] text-slate-400">You owe them</span></>
              }
            </div>
          </div>

          {/* State badge + menu */}
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.badge, cfg.badgeText)}>
              {STATE_LABELS[loop.state]}
            </span>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30">
                  <button
                    onClick={handleDraft}
                    disabled={drafting}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#7C5CFC] hover:bg-[#7C5CFC]/5 disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {drafting ? 'Generating…' : loop.next_action ? 'Regenerate draft' : 'Generate AI draft'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle2 size={12} /> Mark as closed
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Delete loop
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
          {loop.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className={cn('flex items-center gap-1 text-[11px] font-medium', dueDateColor(loop.expected_by))}>
            <CalendarClock size={11} />
            <span>{dueDateLabel(loop.expected_by)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {loop.nudge_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100 font-medium">
                nudge #{loop.nudge_count + 1}
              </span>
            )}
            {loop.next_action && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#7C5CFC]/8 text-[#7C5CFC] border border-[#7C5CFC]/15 font-medium">
                <Send size={8} /> draft ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-[2px] w-full bg-slate-100">
        <div
          className={cn('h-full', loop.confidence >= 0.8 ? 'bg-green-400' : loop.confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-300')}
          style={{ width: `${Math.round((loop.confidence ?? 0) * 100)}%` }}
        />
      </div>
    </div>
  )
}
