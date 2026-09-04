'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { LoopCard } from './LoopCard'
import { AddLoopDialog } from './AddLoopDialog'
import { createClient } from '@/lib/supabase/client'
import type { Loop, LoopState } from '@/types/loop'

const COLUMNS: { state: LoopState; label: string; dot: string; count_color: string }[] = [
  { state: 'waiting',   label: 'Waiting',   dot: 'bg-[#3b82f6]', count_color: 'bg-[#3b82f6]/10 text-[#3b82f6]' },
  { state: 'due',       label: 'Due',       dot: 'bg-[#f59e0b]', count_color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
  { state: 'overdue',   label: 'Overdue',   dot: 'bg-[#ef4444]', count_color: 'bg-[#ef4444]/10 text-[#ef4444]' },
  { state: 'escalated', label: 'Escalated', dot: 'bg-[#8b5cf6]', count_color: 'bg-[#8b5cf6]/10 text-[#8b5cf6]' },
]

export function LoopBoard() {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchParams = useSearchParams()

  const fetchLoops = useCallback(async () => {
    const res = await fetch('/api/loops')
    if (res.ok) {
      const data: Loop[] = await res.json()
      setLoops(data.filter((l) => l.state !== 'closed'))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLoops()
  }, [fetchLoops])

  // Scan on ?scan=1
  useEffect(() => {
    if (searchParams.get('scan') !== '1') return
    const run = async () => {
      toast.loading('Scanning loops...')
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

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('loops-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loops' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newLoop = payload.new as Loop
          if (newLoop.state !== 'closed') {
            setLoops((prev) => [newLoop, ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Loop
          if (updated.state === 'closed') {
            setLoops((prev) => prev.filter((l) => l.id !== updated.id))
          } else {
            setLoops((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
          }
        } else if (payload.eventType === 'DELETE') {
          setLoops((prev) => prev.filter((l) => l.id !== (payload.old as Loop).id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdate = (updated: Loop) => {
    setLoops((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  const handleClose = (id: string) => {
    setLoops((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[#71717a] text-sm">Loading loops...</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-[800px]">
          {COLUMNS.map(({ state, label, dot, count_color }) => {
            const items = loops.filter((l) => l.state === state)
            return (
              <div key={state} className="flex-1 min-w-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-sm font-medium text-[#f5f5f5]">{label}</span>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${count_color}`}>
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div
                  className="flex flex-col gap-3 overflow-y-auto pr-1"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                >
                  {items.length === 0 ? (
                    <div className="border border-dashed border-[#1a1a1a] rounded-lg p-6 text-center">
                      <p className="text-xs text-[#71717a]">No loops here</p>
                    </div>
                  ) : (
                    items.map((loop) => (
                      <LoopCard
                        key={loop.id}
                        loop={loop}
                        onUpdate={handleUpdate}
                        onClose={handleClose}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddLoopDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={fetchLoops}
      />
    </>
  )
}
