import Image from 'next/image'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 opacity-60">
        <Image src="/logo.svg" alt="FollowThrough" width={48} height={48} />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">You&apos;re offline</h1>
      <p className="text-sm text-slate-400 max-w-xs mb-8 leading-relaxed">
        FollowThrough needs a connection to sync your loops. Check your Wi-Fi and try again.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#1a1a1a]/85 transition-colors shadow-sm"
      >
        Try again
      </Link>
    </main>
  )
}
