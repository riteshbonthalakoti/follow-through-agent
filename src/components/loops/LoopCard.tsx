'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle, Trash2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Loop } from '@/types/loop'

const STATE_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  waiting:   { color: 'text-[#3b82f6]', dot: 'bg-[#3b82f6]', label: 'Waiting' },
  due:       { color: 'text-[#f59e0b]', dot: 'bg-[#f59e0b]', label: 'Due' },
  overdue:   { color: 'text-[#ef4444]', dot: 'bg-[#ef4444]', label: 'Overdue' },
  escalated: { color: 'text-[#8b5cf6]', dot: 'bg-[#8b5cf6]', label: 'Escalated' },
  closed:    { color: 'text-[#22c55e]', dot: 'bg-[#22c55e]', label: 'Closed' },
}

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email',
  manual: 'Manual',
  voice: 'Voice',
}

function dueDateColor(dateStr: string): string {
  const d = new Date(dateStr)
  if (isPast(d) && !isToday(d)) return 'text-[#ef4444]'
  if (isToday(d) || isTomorrow(d)) return 'text-[#f59e0b]'
  return 'text-[#71717a]'
}

function dueDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isPast(d) && !isToday(d)) {
    return `${formatDistanceToNow(d)} overdue`
  }
  if (isToday(d)) return 'due today'
  return `due in ${formatDistanceToNow(d)}`
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
      if (!res.ok) throw new Error('Failed')
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
        'relative rounded-lg border border-[#1a1a1a] bg-[#111111] p-4 cursor-pointer',
        'hover:border-[#2a2a2a] transition-colors group'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
          <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {loop.direction === 'inbound' ? (
            <ArrowDown size={12} className="text-[#71717a]" />
          ) : (
            <ArrowUp size={12} className="text-[#71717a]" />
          )}
          {/* Hover actions */}
          {hovered && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handleClose}
                disabled={closing}
                className="p-1 rounded hover:bg-[#1a1a1a] text-[#71717a] hover:text-[#22c55e] transition-colors"
                title="Close loop"
              >
                <CheckCircle size={13} />
              </button>
              {loop.next_action && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-[#1a1a1a] text-[#71717a] hover:text-[#f5f5f5] transition-colors"
                  title="View draft"
                >
                  <MessageSquare size={13} />
                </button>
              )}
              <button
                onClick={handleClose}
                disabled={closing}
                className="p-1 rounded hover:bg-[#1a1a1a] text-[#71717a] hover:text-[#ef4444] transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Counterparty */}
      <p className="text-sm font-medium text-[#f5f5f5] mb-1">{loop.counterparty}</p>

      {/* Description */}
      <p className="text-xs text-[#71717a] line-clamp-2 mb-3">{loop.description}</p>

      {/* Due date */}
      <div className={cn('flex items-center gap-1.5 text-xs mb-3', dueDateColor(loop.expected_by))}>
        <CalendarClock size={11} />
        <span>{dueDateLabel(loop.expected_by)}</span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#71717a] border border-[#2a2a2a]">
          {SOURCE_LABELS[loop.source] ?? loop.source}
        </span>
        {loop.confidence < 0.9 && (
          <span className="text-[10px] text-[#f59e0b]">
            {Math.round(loop.confidence * 100)}% confident
          </span>
        )}
      </div>
    </div>
  )
}
