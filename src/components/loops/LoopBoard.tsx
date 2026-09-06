'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Mail, Sparkles } from 'lucide-react'
import { LoopCard, computePriority } from './LoopCard'
import { AddLoopDialog } from './AddLoopDialog'
import { createClient } from '@/lib/supabase/client'
import type { Loop, LoopState } from '@/types/loop'

const COLUMNS: { state: LoopState; label: string; accent: string; pill: string; bar: string; emptyIcon: string; emptyText: string }[] = [
  { state: 'waiting',   label: 'Waiting',   accent: 'border-slate-200', pill: 'bg-blue-50 text-blue-600',     bar: 'bg-blue-400',   emptyIcon: '⏳', emptyText: 'No loops waiting on others' },
  { state: 'due',       label: 'Due',       accent: 'border-amber-200', pill: 'bg-amber-50 text-amber-600',   bar: 'bg-amber-400',  emptyIcon: '✅', emptyText: 'Nothing due today' },
  { state: 'overdue',   label: 'Overdue',   accent: 'border-red-200',   pill: 'bg-red-50 text-red-600',       bar: 'bg-red-400',    emptyIcon: '🎉', emptyText: 'Nothing overdue — you\'re on top of it' },
  { state: 'escalated', label: 'Escalated', accent: 'border-[#7C5CFC]/25',pill: 'bg-[#7C5CFC]/10 text-[#7C5CFC]', bar: 'bg-[#7C5CFC]', emptyIcon: '🤝', emptyText: 'No escalations needed' },
]

interface LoopBoardProps {
  externalDialogOpen?: boolean
  onExternalDialogClose?: () => void
}

export function LoopBoard({ externalDialogOpen, onExternalDialogClose }: LoopBoardProps) {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [internalDialog, setInternalDialog] = useState(false)
  const searchParams = useSearchParams()

  const dialogOpen = externalDialogOpen ?? internalDialog
  const closeDialog = () => { onExternalDialogClose?.(); setInternalDialog(false) }
  const [connecting, setConnecting] = useState(false)

  const connectGmail = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/gmail/connect')
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error('Failed to start OAuth')
      const w = window.open(data.url, 'gmail-oauth', 'width=500,height=650,left=200,top=100')
      if (!w) window.location.href = data.url
    } catch {
      toast.error('Could not open Google sign-in')
    } finally {
      setConnecting(false)
    }
  }

  const fetchLoops = useCallback(async () => {
    const res = await fetch('/api/loops')
    if (res.ok) {
      const { loops: data }: { loops: Loop[] } = await res.json()
      setLoops((data ?? []).filter(l => l.state !== 'closed'))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLoops() }, [fetchLoops])

  useEffect(() => {
    if (searchParams.get('scan') !== '1') return
    const run = async () => {
      toast.loading('Scanning loops…')
      try {
        const res = await fetch('/api/loops/scan', { method: 'POST' })
        const data = await res.json()
        toast.dismiss(); toast.success(`Scan complete: ${data.updated ?? 0} updated`)
        fetchLoops()
      } catch { toast.dismiss(); toast.error('Scan failed') }
    }
    run()
  }, [searchParams, fetchLoops])

  useEffect(() => {
    const sb = createClient()
    const ch = sb.channel('loops-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loops' }, p => {
        if (p.eventType === 'INSERT') {
          const l = p.new as Loop
          if (l.state !== 'closed') setLoops(prev => [l, ...prev])
        } else if (p.eventType === 'UPDATE') {
          const l = p.new as Loop
          if (l.state === 'closed') setLoops(prev => prev.filter(x => x.id !== l.id))
          else setLoops(prev => prev.map(x => x.id === l.id ? l : x))
        } else if (p.eventType === 'DELETE') {
          setLoops(prev => prev.filter(x => x.id !== (p.old as Loop).id))
        }
      }).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(c => (
          <div key={c.state} className="space-y-3">
            <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (loops.length === 0) {
    return (
      <>
        <div className="rounded-3xl border border-[#1a1a1a]/8 bg-white p-10 sm:p-14 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#7C5CFC]/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={22} className="text-[#7C5CFC]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight mb-2">Nothing tracked yet</h2>
          <p className="text-sm text-[#1a1a1a]/45 leading-relaxed max-w-sm mx-auto mb-8">
            Add a loop manually, or connect Gmail so FollowThrough can find open commitments in your inbox automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setInternalDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#1a1a1a]/85 transition-colors w-full sm:w-auto"
            >
              <Plus size={15} /> Add your first loop
            </button>
            <button
              onClick={connectGmail}
              disabled={connecting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#1a1a1a]/15 text-[#1a1a1a] text-sm font-semibold hover:bg-[#1a1a1a]/5 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <Mail size={15} /> {connecting ? 'Opening…' : 'Connect Gmail'}
            </button>
          </div>
        </div>

        {/* Column previews, quiet, beneath the CTA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 max-w-2xl mx-auto opacity-60">
          {COLUMNS.map(({ state, label, pill, bar }) => (
            <div key={state} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/60 border border-[#1a1a1a]/6">
              <div className={`w-1.5 h-1.5 rounded-full ${bar}`} />
              <span className="text-[11px] font-semibold text-[#1a1a1a]/45 uppercase tracking-wide">{label}</span>
              <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full ${pill}`}>0</span>
            </div>
          ))}
        </div>

        <AddLoopDialog open={dialogOpen} onClose={closeDialog} onAdded={fetchLoops} />
      </>
    )
  }

  return (
    <>
      {/* ── Mobile: tab pills + single column ──────────────────────────── */}
      <MobileBoard
        loops={loops}
        onUpdate={u => setLoops(prev => prev.map(l => l.id === u.id ? u : l))}
        onClose={id => setLoops(prev => prev.filter(l => l.id !== id))}
      />

      {/* ── Desktop: 4-column kanban ────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto -mx-1 px-1 pb-2">
        <div className="flex gap-4" style={{ minWidth: 'max(640px, 100%)' }}>
          {COLUMNS.map(({ state, label, accent, pill, bar, emptyIcon, emptyText }) => {
            const raw = loops.filter(l => l.state === state)
            const items = state === 'overdue'
              ? [...raw].sort((a, b) => computePriority(b) - computePriority(a))
              : raw
            return (
              <div key={state} className="flex-1 min-w-[260px] flex flex-col gap-3">
                <div className={`sticky top-14 z-10 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border ${accent} shadow-sm`}>
                  <div className={`w-2 h-2 rounded-full ${bar}`} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${pill}`}>{items.length}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-center px-4">
                      <span className="text-2xl">{emptyIcon}</span>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">{emptyText}</p>
                    </div>
                  ) : (
                    items.map(loop => (
                      <LoopCard key={loop.id} loop={loop}
                        onUpdate={u => setLoops(prev => prev.map(l => l.id === u.id ? u : l))}
                        onClose={id => setLoops(prev => prev.filter(l => l.id !== id))}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddLoopDialog open={dialogOpen} onClose={closeDialog} onAdded={fetchLoops} />
    </>
  )
}

// ── Mobile tab board ──────────────────────────────────────────────────────────

function MobileBoard({ loops, onUpdate, onClose }: {
  loops: Loop[]
  onUpdate: (u: Loop) => void
  onClose: (id: string) => void
}) {
  const [active, setActive] = useState<LoopState>('overdue')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-select the most urgent tab that has items
  useEffect(() => {
    const priority: LoopState[] = ['overdue', 'due', 'waiting', 'escalated']
    const first = priority.find(s => loops.some(l => l.state === s))
    if (first) setActive(first)
  }, [loops])

  const items = loops.filter(l => l.state === active)
    .sort((a, b) => active === 'overdue' ? computePriority(b) - computePriority(a) : 0)

  return (
    <div className="sm:hidden flex flex-col gap-3">
      {/* Tab pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {COLUMNS.map(({ state, label, pill, bar }) => {
          const count = loops.filter(l => l.state === state).length
          const isActive = active === state
          return (
            <button
              key={state}
              onClick={() => { setActive(state); scrollRef.current?.scrollTo({ top: 0 }) }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                isActive
                  ? `bg-[#1a1a1a] text-white border-transparent`
                  : `bg-white text-slate-500 border-slate-200`
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/60' : bar}`} />
              {label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : pill}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div ref={scrollRef} className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-center px-4">
            <span className="text-3xl">{COLUMNS.find(c => c.state === active)?.emptyIcon}</span>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">{COLUMNS.find(c => c.state === active)?.emptyText}</p>
          </div>
        ) : (
          items.map(loop => (
            <LoopCard key={loop.id} loop={loop} onUpdate={onUpdate} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  )
}
