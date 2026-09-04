import { Suspense } from 'react'
import { LoopBoard } from '@/components/loops/LoopBoard'
import { AddLoopDialog } from '@/components/loops/AddLoopDialog'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Loop Board" showAddLoop />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<p className="text-[#71717a] text-sm">Loading...</p>}>
          <LoopBoard />
        </Suspense>
      </div>
    </div>
  )
}
