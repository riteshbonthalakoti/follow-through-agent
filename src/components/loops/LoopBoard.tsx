'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { LoopCard } from './LoopCard'
import { AddLoopDialog } from './AddLoopDialog'
import { createClient } from '@/lib/supabase/client'
import type { Loop, LoopState } from '@/types/loop'

const COLUMNS: { state: LoopState; label: string; accent: string; pill: string }[] = [
  { state: 'waiting',   label: 'Waiting',   accent: 'border-blue-200',   pill: 'bg-blue-50 text-blue-600' },
  { state: 'due',       label: 'Due',       accent: 'border-amber-200',  pill: 'bg-amber-50 text-amber-600' },
  { state: 'overdue',   label: 'Overdue',   accent: 'border-red-200',    pill: 'bg-red-50 text-red-600' },
  { state: 'escalated', label: 'Escalated', accent: 'border-violet-200', pill: 'bg-violet-50 text-violet-600' },
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
  const closeDialog = () => {
    onExternalDialogClose?.()
    setInternalDialog(false)
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
        toast.dismiss()
        toast.success(`Scan complete: ${data.updated ?? 0} updated`)
        fetchLoops()
      } catch {
        toast.dismiss()
        toast.error('Scan failed')
      }
    }
    run()
  }, [searchParams, fetchLoops])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('loops-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loops' }, payload => {
        if (payload.eventType === 'INSERT') {
          const l = payload.new as Loop
          if (l.state !== 'closed') setLoops(prev => [l, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const l = payload.new as Loop
          if (l.state === 'closed') setLoops(prev => prev.filter(x => x.id !== l.id))
          else setLoops(prev => prev.map(x => x.id === l.id ? l : x))
        } else if (payload.eventType === 'DELETE') {
          setLoops(prev => prev.filter(x => x.id !== (payload.old as Loop).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        Loading loops…
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-4 min-w-[680px] md:min-w-0 md:grid md:grid-cols-4">
          {COLUMNS.map(({ state, label, accent, pill }) => {
            const items = loops.filter(l => l.state === state)
            return (
              <div key={state} className="flex-1 min-w-0 flex flex-col">
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border bg-white ${accent}`}>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${pill}`}>
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 230px)' }}>
                  {items.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-white/40">
                      <p className="text-xs text-slate-400">All clear here</p>
                    </div>
                  ) : (
                    items.map(loop => (
                      <LoopCard
                        key={loop.id}
                        loop={loop}
                        onUpdate={updated => setLoops(prev => prev.map(l => l.id === updated.id ? updated : l))}
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
