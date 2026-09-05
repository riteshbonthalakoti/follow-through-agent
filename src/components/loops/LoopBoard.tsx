'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { LoopCard } from './LoopCard'
import { AddLoopDialog } from './AddLoopDialog'
import { createClient } from '@/lib/supabase/client'
import { InboxIcon } from 'lucide-react'
import type { Loop, LoopState } from '@/types/loop'

const COLUMNS: { state: LoopState; label: string; accent: string; pill: string; bar: string }[] = [
  { state: 'waiting',   label: 'Waiting',   accent: 'border-slate-200', pill: 'bg-blue-50 text-blue-600',     bar: 'bg-blue-400' },
  { state: 'due',       label: 'Due',       accent: 'border-amber-200', pill: 'bg-amber-50 text-amber-600',   bar: 'bg-amber-400' },
  { state: 'overdue',   label: 'Overdue',   accent: 'border-red-200',   pill: 'bg-red-50 text-red-600',       bar: 'bg-red-400' },
  { state: 'escalated', label: 'Escalated', accent: 'border-violet-200',pill: 'bg-violet-50 text-violet-600', bar: 'bg-violet-400' },
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

  return (
    <>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-4 min-w-[640px] md:min-w-0 md:grid md:grid-cols-4">
          {COLUMNS.map(({ state, label, accent, pill, bar }) => {
            const items = loops.filter(l => l.state === state)
            return (
              <div key={state} className="flex-1 min-w-0 flex flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border ${accent} shadow-sm`}>
                  <div className={`w-2 h-2 rounded-full ${bar}`} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${pill}`}>{items.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border border-dashed border-slate-200 bg-white/50">
                      <InboxIcon size={18} className="text-slate-300" />
                      <p className="text-xs text-slate-300 font-medium">All clear</p>
                    </div>
                  ) : (
                    items.map(loop => (
                      <LoopCard
                        key={loop.id}
                        loop={loop}
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
