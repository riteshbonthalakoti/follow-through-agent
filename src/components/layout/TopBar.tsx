'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddLoopDialog } from '@/components/loops/AddLoopDialog'

interface TopBarProps {
  title: string
  showAddLoop?: boolean
}

export function TopBar({ title, showAddLoop }: TopBarProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
      <h1 className="text-base font-semibold text-[#f5f5f5]">{title}</h1>
      {showAddLoop && (
        <>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <Plus size={15} />
            Add Loop
          </button>
          <AddLoopDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
          />
        </>
      )}
    </div>
  )
}
