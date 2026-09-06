'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { X, ArrowDown, ArrowUp, Loader2, User, FileText, Calendar, RefreshCw } from 'lucide-react'

interface AddLoopDialogProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}

export function AddLoopDialog({ open, onClose, onAdded }: AddLoopDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ counterparty: '', description: '', expected_by: '', direction: 'inbound', source: 'manual' })
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 60)
    if (!open) setForm({ counterparty: '', description: '', expected_by: '', direction: 'inbound', source: 'manual' })
  }, [open])

  // Trap escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.counterparty || !form.description || !form.expected_by) return
    setLoading(true)
    try {
      const res = await fetch('/api/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expected_by: new Date(form.expected_by).toISOString() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Loop added')
      onAdded?.()
      onClose()
    } catch { toast.error('Failed to add loop') }
    finally { setLoading(false) }
  }

  // Default to 7 days from now
  const defaultDate = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg ring-1 ring-slate-200/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Track a new loop</h2>
            <p className="text-xs text-slate-400 mt-0.5">What are you waiting on — and from whom?</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Direction toggle */}
          <div className="flex rounded-xl border border-slate-200 p-1 gap-1 bg-slate-50">
            {[
              { value: 'inbound',  label: 'They owe me', icon: ArrowDown },
              { value: 'outbound', label: 'I owe them',  icon: ArrowUp },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, direction: value }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  form.direction === value
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Source */}
          <div className="flex rounded-xl border border-slate-200 p-1 gap-1 bg-slate-50">
            {[
              { value: 'manual',   label: 'Manual',   emoji: '✏️' },
              { value: 'email',    label: 'Email',    emoji: '📧' },
              { value: 'calendar', label: 'Calendar', emoji: '📅' },
            ].map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, source: value }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  form.source === value
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>

          {/* Person */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <User size={11} /> Person
            </label>
            <input
              ref={firstRef}
              type="text"
              required
              placeholder="e.g. Rahul Sharma, TechCorp HR…"
              value={form.counterparty}
              onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
            />
          </div>

          {/* What */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText size={11} /> What they owe you
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Send revised proposal PDF, confirm the meeting time…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all resize-none"
            />
          </div>

          {/* Due date */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={11} /> Expected by
              </label>
              <input
                type="date"
                required
                value={form.expected_by}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, expected_by: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, expected_by: defaultDate }))}
              className="self-end px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={11} />
              +7d
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.counterparty || !form.description || !form.expected_by}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add Loop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
