'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Edit3, X, Sparkles, Clock, Send, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Loop } from '@/types/loop'

const STATE_BADGE: Record<string, string> = {
  waiting:   'bg-blue-50 text-blue-600 border-blue-100',
  due:       'bg-amber-50 text-amber-600 border-amber-100',
  overdue:   'bg-red-50 text-red-500 border-red-100',
  escalated: 'bg-violet-50 text-violet-600 border-violet-100',
}

function nudgeLabel(n: number) {
  if (n === 0) return 'First reach-out'
  if (n === 1) return '2nd nudge'
  if (n === 2) return '3rd nudge'
  return `${n + 1}th nudge`
}

function makeTemplate(type: 'gentle' | 'firm' | 'final', name: string, date: string) {
  const d = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (type === 'gentle') return `Hi ${name},\n\nJust circling back on this — wanted to make sure it didn't slip through the cracks.\n\nWould love to hear back when you get a chance.\n\nThanks`
  if (type === 'firm')   return `Hi ${name},\n\nI need this resolved by ${d}. Could you please confirm or let me know if there's a blocker?\n\nAppreciate your prompt response.`
  return `Hi ${name},\n\nThis is my final follow-up before I need to escalate or close this out. Please respond by ${d}.\n\nThank you.`
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
      const { loops: data }: { loops: Loop[] } = await res.json()
      setLoops((data ?? []).filter(l => l.next_action !== null))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLoops() }, [fetchLoops])

  useEffect(() => {
    const sb = createClient()
    const ch = sb.channel('approvals-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loops' }, p => {
        if (p.eventType === 'UPDATE') {
          const l = p.new as Loop
          if (!l.next_action) setLoops(prev => prev.filter(x => x.id !== l.id))
          else setLoops(prev => {
            const exists = prev.find(x => x.id === l.id)
            return exists ? prev.map(x => x.id === l.id ? l : x) : [l, ...prev]
          })
        } else if (p.eventType === 'DELETE') {
          setLoops(prev => prev.filter(x => x.id !== (p.old as Loop).id))
        }
      }).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  // Feature 1: real send via Gmail API
  const handleSend = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setLoops(prev => prev.filter(l => l.id !== loop.id))
      toast.success('Email sent via Gmail!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send')
    } finally { setActing(null) }
  }

  const handleSaveEdit = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_action: editText }),
      })
      if (!res.ok) throw new Error()
      setLoops(prev => prev.map(l => l.id === loop.id ? { ...l, next_action: editText } : l))
      setEditingId(null)
      toast.success('Draft updated')
    } catch { toast.error('Failed to update draft') }
    finally { setActing(null) }
  }

  const handleDismiss = async (loop: Loop) => {
    setActing(loop.id)
    try {
      const res = await fetch(`/api/loops/${loop.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_action: null }),
      })
      if (!res.ok) throw new Error()
      setLoops(prev => prev.filter(l => l.id !== loop.id))
      toast.success('Draft dismissed')
    } catch { toast.error('Failed to dismiss') }
    finally { setActing(null) }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-white border border-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (loops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Inbox zero</h2>
        <p className="text-sm text-slate-400 max-w-xs">No draft follow-ups waiting for your review right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={16} className="text-violet-500" />
        <p className="text-sm text-slate-500">AI-drafted follow-ups — review each one before sending.</p>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
          {loops.length} pending
        </span>
      </div>

      {loops.map(loop => {
        const badgeClass = STATE_BADGE[loop.state] ?? STATE_BADGE.waiting
        const isEditing = editingId === loop.id
        const isActing = acting === loop.id
        const nudges = loop.nudge_count ?? 0

        return (
          <div
            key={loop.id}
            className={cn(
              'rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all',
              isActing && 'opacity-60 pointer-events-none'
            )}
          >
            {/* Card header */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center shrink-0">
                {loop.counterparty[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">{loop.counterparty}</p>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', badgeClass)}>
                    {loop.state.charAt(0).toUpperCase() + loop.state.slice(1)}
                  </span>
                  {/* Feature 4: nudge history badge */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100 flex items-center gap-1">
                    <Clock size={9} />
                    {nudgeLabel(nudges)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{loop.description}</p>
              </div>
              {loop.state === 'overdue' && (
                <span title="High priority" className="text-base shrink-0">🔥</span>
              )}
            </div>

            {/* Draft content */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={11} className="text-violet-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">AI draft</span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {/* Feature 3: Template picker */}
                  <div className="flex gap-2 flex-wrap">
                    {(['gentle', 'firm', 'final'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditText(makeTemplate(t, loop.counterparty, loop.expected_by))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all capitalize"
                      >
                        {t === 'gentle' && '🌿 '}
                        {t === 'firm' && '⚡ '}
                        {t === 'final' && '🚨 '}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-300 self-center">quick-fill templates</span>
                  </div>

                  <textarea
                    rows={6}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(loop)}
                      disabled={isActing}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">{loop.next_action}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="px-5 pb-4 flex gap-2">
                {/* Feature 1: real Gmail send */}
                <button
                  onClick={() => handleSend(loop)}
                  disabled={isActing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send size={13} />
                  Approve &amp; Send
                </button>
                <button
                  onClick={() => { setEditingId(loop.id); setEditText(loop.next_action ?? '') }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
                <button
                  onClick={() => handleDismiss(loop)}
                  disabled={isActing}
                  className="px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Dismiss draft"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
