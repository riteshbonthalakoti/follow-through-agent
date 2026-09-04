import { ApprovalsQueue } from '@/components/loops/ApprovalsQueue'
import { TopBar } from '@/components/layout/TopBar'

export default function ApprovalsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Approvals" />
      <div className="flex-1 overflow-auto p-6">
        <ApprovalsQueue />
      </div>
    </div>
  )
}
