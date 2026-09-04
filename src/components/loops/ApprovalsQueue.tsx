'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Loop } from '@/types/loop'

const STATE_CONFIG: Record<string, { dot: string; color: string; label: string }> = {
  waiting:   { dot: 'bg-[#3b82f6]', color: 'text-[#3b82f6]', label: 'Waiting' },
  due:       { dot: 'bg-[#f59e0b]', color: 'text-[#f59e0b]', label: 'Due' },
  overdue:   { dot: 'bg-[#ef4444]', color: 'text-[#ef4444]', label: 'Overdue' },
  escalated: { dot: 'bg-[#8b5cf6]', color: 'text-[#8b5cf6]', label: 'Escalated' },
  closed:    { dot: 'bg-[#22c55e]', color: 'text-[#22c55e]', label: 'Closed' },
}

export function ApprovalsQueue() {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const fetchLoops = useCallback(async () => {
    const res = await fetch('/api/loops')
    if (res.ok) {
      const data: Loop[] = await res.json()
      setLoops(data.filter((l) => l.next_action !== null))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLoops()
  }, [fetchLoops])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('approvals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loops' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Loop
          if (!updated.next_action) {
            setLoops((prev) => prev.filter((l) => l.id !== updated.id))
          } else {
            setLoops((prev) => {
              const exists = prev.find((l) => l.id === updated.id)
              if (exists) return prev.map((l) => (l.id === updated.id ? updated : l))
              return [updated, ...prev]
            })
          }
        } else if (payload.eventType === 'DELETE') {
          setLoops((prev) => prev.filter((l) => l.id !== (payload.old as Loop).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleApprove = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'escalated' }),
      })
      if (!res.ok) throw new Error('Failed')
      setLoops((prev) => prev.filter((l) => l.id !== loop.id))
      toast.success('Approved & sent')
    } catch {
      toast.error('Failed to approve')
    } finally {
      setActing(null)
    }
  }

  const handleSaveEdit = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_action: editText }),
      })
      if (!res.ok) throw new Error('Failed')
      setLoops((prev) => prev.map((l) => l.id === loop.id ? { ...l, next_action: editText } : l))
      setEditingId(null)
      toast.success('Draft updated')
    } catch {
      toast.error('Failed to update draft')
    } finally {
      setActing(null)
    }
  }

  const handleDismiss = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_action: null }),
      })
      if (!res.ok) throw new Error('Failed')
      setLoops((prev) => prev.filter((l) => l.id !== loop.id))
      toast.success('Draft dismissed')
    } catch {
      toast.error('Failed to dismiss')
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[#71717a] text-sm">Loading...</p>
      </div>
    )
  }

  if (loops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle size={40} className="text-[#22c55e] mb-4" />
        <h2 className="text-[#f5f5f5] font-semibold text-lg mb-1">All clear</h2>
        <p className="text-[#71717a] text-sm">No approvals pending</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {loops.map((loop) => {
        const cfg = STATE_CONFIG[loop.state] ?? STATE_CONFIG.waiting
        const isEditing = editingId === loop.id
        const isActing = acting === loop.id

        return (
          <div key={loop.id} className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              <span className="ml-auto text-xs text-[#71717a]">{loop.counterparty}</span>
            </div>

            <p className="text-sm font-medium text-[#f5f5f5] mb-1">{loop.description}</p>
            <p className="text-xs text-[#71717a] mb-4">{loop.counterparty}</p>

            {/* Draft */}
            {isEditing ? (
              <div className="mb-4">
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-[#f5f5f5] text-sm font-mono focus:outline-none focus:border-[#7c3aed] resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSaveEdit(loop)}
                    disabled={isActing}
                    className="px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-lg border border-[#1a1a1a] text-[#71717a] text-sm hover:text-[#f5f5f5] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] p-3 mb-4">
                <p className="text-sm text-[#f5f5f5] font-mono whitespace-pre-wrap">{loop.next_action}</p>
              </div>
            )}

            {!isEditing && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(loop)}
                  disabled={isActing}
                  className="flex-1 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
                >
                  {isActing ? 'Sending...' : 'Approve & Send'}
                </button>
                <button
                  onClick={() => { setEditingId(loop.id); setEditText(loop.next_action ?? '') }}
                  className="px-4 py-2.5 rounded-lg border border-[#1a1a1a] text-[#71717a] text-sm hover:border-[#2a2a2a] hover:text-[#f5f5f5] transition-colors"
                >
                  Edit Draft
                </button>
                <button
                  onClick={() => handleDismiss(loop)}
                  disabled={isActing}
                  className="px-4 py-2.5 rounded-lg text-[#ef4444] text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
