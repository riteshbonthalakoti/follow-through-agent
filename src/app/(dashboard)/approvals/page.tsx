import { ApprovalsQueue } from '@/components/loops/ApprovalsQueue'
import { Sparkles } from 'lucide-react'

export default function ApprovalsPage() {
  return (
    <>
      <div className="mb-7">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Approvals</h1>
        <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#7C5CFC]" />
          AI-drafted follow-ups ready for your review
        </p>
      </div>
      <ApprovalsQueue />
    </>
  )
}
