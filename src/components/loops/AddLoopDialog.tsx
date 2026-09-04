'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface AddLoopDialogProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}

export function AddLoopDialog({ open, onClose, onAdded }: AddLoopDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    counterparty: '',
    description: '',
    expected_by: '',
    direction: 'inbound',
  })

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.counterparty || !form.description || !form.expected_by) return
    setLoading(true)
    try {
      const res = await fetch('/api/loops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'manual',
          expected_by: new Date(form.expected_by).toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Loop added')
      onAdded?.()
      onClose()
      setForm({ counterparty: '', description: '', expected_by: '', direction: 'inbound' })
    } catch {
      toast.error('Failed to add loop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#f5f5f5] font-semibold text-base">Add Loop</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#f5f5f5] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">Who owes you this?</label>
            <input
              type="text"
              required
              placeholder="Rahul Sharma"
              value={form.counterparty}
              onChange={(e) => setForm((f) => ({ ...f, counterparty: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">What do they owe you?</label>
            <textarea
              required
              rows={3}
              placeholder="Send the revised proposal PDF"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">Expected by</label>
            <input
              type="date"
              required
              value={form.expected_by}
              onChange={(e) => setForm((f) => ({ ...f, expected_by: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">Direction</label>
            <select
              value={form.direction}
              onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] text-[#f5f5f5] text-sm focus:outline-none focus:border-[#7c3aed] transition-colors"
            >
              <option value="inbound">They owe me (inbound)</option>
              <option value="outbound">I owe them (outbound)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#1a1a1a] text-[#71717a] text-sm hover:border-[#2a2a2a] hover:text-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Loop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
