'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2, Trash2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Loop } from '@/types/loop'

const STATE_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  waiting:   { badge: 'bg-blue-50 text-blue-600 border-blue-100',     dot: 'bg-blue-400',   label: 'Waiting' },
  due:       { badge: 'bg-amber-50 text-amber-600 border-amber-100',  dot: 'bg-amber-400',  label: 'Due' },
  overdue:   { badge: 'bg-red-50 text-red-500 border-red-100',        dot: 'bg-red-400',    label: 'Overdue' },
  escalated: { badge: 'bg-violet-50 text-violet-600 border-violet-100', dot: 'bg-violet-400', label: 'Escalated' },
  closed:    { badge: 'bg-green-50 text-green-600 border-green-100',  dot: 'bg-green-400',  label: 'Closed' },
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
  return `due in ${formatDistanceToNow(date)}`
}

interface LoopCardProps {
  loop: Loop
  onUpdate: (updated: Loop) => void
  onClose: (id: string) => void
}

export function LoopCard({ loop, onUpdate, onClose }: LoopCardProps) {
  const [hovered, setHovered] = useState(false)
  const [closing, setClosing] = useState(false)

  const cfg = STATE_CONFIG[loop.state] ?? STATE_CONFIG.waiting

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
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
    } catch {
      toast.error('Failed to close loop')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-white border border-slate-200/80 p-4 shadow-sm cursor-pointer',
        'hover:shadow-md hover:border-slate-300 transition-all duration-150'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border', cfg.badge)}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          {loop.direction === 'inbound'
            ? <ArrowDown size={11} className="text-slate-300" />
            : <ArrowUp size={11} className="text-slate-300" />
          }
          {hovered && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={handleClose}
                disabled={closing}
                className="p-1.5 rounded-lg hover:bg-green-50 text-slate-300 hover:text-green-500 transition-colors"
                title="Mark closed"
              >
                <CheckCircle2 size={13} />
              </button>
              {loop.next_action && (
                <button
                  onClick={e => e.stopPropagation()}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                  title="View draft"
                >
                  <MessageSquare size={13} />
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={closing}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Person */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-semibold uppercase shrink-0">
          {loop.counterparty?.[0] ?? '?'}
        </div>
        <p className="text-sm font-semibold text-slate-800 truncate">{loop.counterparty}</p>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed pl-8">{loop.description}</p>

      {/* Footer */}
      <div className="flex items-center gap-2 pl-8">
        <div className={cn('flex items-center gap-1 text-[11px]', dueDateColor(loop.expected_by))}>
          <CalendarClock size={11} />
          <span>{dueDateLabel(loop.expected_by)}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
            {SOURCE_LABELS[loop.source] ?? loop.source}
          </span>
          {loop.nudge_count > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-400 border border-red-100">
              {loop.nudge_count} nudge{loop.nudge_count !== 1 ? 's' : ''}
            </span>
          )}
          {loop.next_action && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-500 border border-violet-100">
              draft
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
