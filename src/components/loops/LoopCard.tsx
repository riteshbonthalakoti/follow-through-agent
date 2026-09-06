'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, CheckCircle2, Trash2, MessageSquare, MoreHorizontal } from 'lucide-react'
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

const STATE_CONFIG: Record<string, { badge: string; left: string }> = {
  waiting:   { badge: 'bg-blue-50 text-blue-600 border-blue-100',      left: 'bg-blue-400' },
  due:       { badge: 'bg-amber-50 text-amber-600 border-amber-100',   left: 'bg-amber-400' },
  overdue:   { badge: 'bg-red-50 text-red-500 border-red-100',         left: 'bg-red-400' },
  escalated: { badge: 'bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/15',left: 'bg-[#7C5CFC]' },
  closed:    { badge: 'bg-green-50 text-green-600 border-green-100',   left: 'bg-green-400' },
}
const STATE_LABELS: Record<string, string> = {
  waiting: 'Waiting', due: 'Due', overdue: 'Overdue', escalated: 'Escalated', closed: 'Closed',
}
const SOURCE_LABELS: Record<string, string> = { email: 'Email', manual: 'Manual', voice: 'Voice' }

function dueDateColor(d: string) {
  const date = new Date(d)
  if (isPast(date) && !isToday(date)) return 'text-red-500'
  if (isToday(date) || isTomorrow(date)) return 'text-amber-500'
  return 'text-slate-400'
}
function dueDateLabel(d: string) {
  const date = new Date(d)
  if (isPast(date) && !isToday(date)) return `${formatDistanceToNow(date)} overdue`
  if (isToday(date)) return 'due today'
  return `due ${formatDistanceToNow(date, { addSuffix: true })}`
}

function confidenceColor(c: number) {
  if (c >= 0.8) return 'bg-green-400'
  if (c >= 0.5) return 'bg-amber-400'
  return 'bg-red-400'
}

interface LoopCardProps {
  loop: Loop
  onUpdate: (u: Loop) => void
  onClose: (id: string) => void
}

export function LoopCard({ loop, onUpdate, onClose }: LoopCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const cfg = STATE_CONFIG[loop.state] ?? STATE_CONFIG.waiting
  const isOverdue = loop.state === 'overdue'
  const conf = loop.confidence ?? 0
  const priority = computePriority(loop)
  const isHot = priority > 0.7

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    setClosing(true)
    try {
      const res = await fetch(`/api/loops/${loop.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'closed' }),
      })
      if (!res.ok) throw new Error()
      onClose(loop.id)
      toast.success('Loop closed')
    } catch { toast.error('Failed to close loop') }
    finally { setClosing(false) }
  }

  const avatarColor = [
    'bg-rose-100 text-rose-600', 'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600',
    'bg-sky-100 text-sky-600', 'bg-[#7C5CFC]/10 text-[#7C5CFC]',
  ][loop.counterparty.charCodeAt(0) % 6]

  return (
    <div
      className={cn(
        'group relative rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden',
        'hover:shadow-md hover:border-slate-300 transition-all duration-150',
        closing && 'opacity-50 pointer-events-none',
        isOverdue && 'overdue-pulse'
      )}
    >
      {/* Overdue pulse ring — CSS only, no JS */}
      {isOverdue && (
        <style>{`
          .overdue-pulse::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            border: 2px solid rgba(239,68,68,0.4);
            animation: overdueRing 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
          }
          @keyframes overdueRing {
            0%,100% { opacity: 0; transform: scale(1); }
            50%      { opacity: 1; transform: scale(1.01); }
          }
        `}</style>
      )}

      {/* State accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px]', cfg.left)} />

      <div className="pl-4 pr-3 pt-3 pb-3 relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0', avatarColor)}>
              {loop.counterparty[0]?.toUpperCase() ?? '?'}
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{loop.counterparty}</p>
            {isHot && <span title={`Priority ${Math.round(priority * 100)}%`} className="text-xs shrink-0">🔥</span>}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.badge)}>
              {STATE_LABELS[loop.state]}
            </span>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                  {loop.next_action && (
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <MessageSquare size={12} /> View draft
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle2 size={12} /> Mark closed
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 pl-9">
          {loop.description}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 pl-9">
          <div className={cn('flex items-center gap-1 text-[11px] font-medium', dueDateColor(loop.expected_by))}>
            <CalendarClock size={11} />
            {dueDateLabel(loop.expected_by)}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {loop.direction === 'inbound'
              ? <ArrowDownLeft size={11} className="text-slate-200" />
              : <ArrowUpRight size={11} className="text-slate-200" />
            }
            <span className="text-[10px] text-slate-300">{SOURCE_LABELS[loop.source] ?? loop.source}</span>
          </div>
        </div>

        {/* Badges row */}
        {(loop.nudge_count > 0 || loop.next_action) && (
          <div className="flex gap-1.5 mt-2.5 pl-9 flex-wrap">
            {loop.nudge_count > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100 font-medium">
                {loop.nudge_count === 1 ? '2nd nudge' : loop.nudge_count === 2 ? '3rd nudge' : `${loop.nudge_count + 1}th nudge`}
              </span>
            )}
            {loop.next_action && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/15 font-medium">
                draft ready
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confidence meter — thin bar at bottom */}
      <div className="h-[3px] w-full bg-slate-100">
        <div
          className={cn('h-full transition-all duration-500', confidenceColor(conf))}
          style={{ width: `${Math.round(conf * 100)}%` }}
          title={`Confidence: ${Math.round(conf * 100)}%`}
        />
      </div>
    </div>
  )
}
