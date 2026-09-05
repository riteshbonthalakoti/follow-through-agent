'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckCircle, LogOut, Mail, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface GmailStatus {
  connected: boolean
  connection: { gmail_email: string } | null
}

function GmailBtn() {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    fetch('/api/gmail/scan').then(r => r.json()).then(setStatus).catch(() => {})
    const p = new URLSearchParams(window.location.search)
    if (p.get('gmail') === 'connected') {
      toast.success('Gmail connected!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const scan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/gmail/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.loops_created} new loop${data.loops_created !== 1 ? 's' : ''} detected`)
      const s = await fetch('/api/gmail/scan').then(r => r.json())
      setStatus(s)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  if (!status) return null

  if (!status.connected) {
    return (
      <a
        href="/api/gmail/connect"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
      >
        <Mail size={13} />
        Connect Gmail
      </a>
    )
  }

  return (
    <button
      onClick={scan}
      disabled={scanning}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
    >
      {scanning ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      {scanning ? 'Scanning…' : 'Scan Gmail'}
    </button>
  )
}

interface AppShellProps {
  userEmail: string
  children: React.ReactNode
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  const NAV = [
    { href: '/dashboard', label: 'Board', icon: LayoutDashboard },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          {/* Logo + wordmark */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="FollowThrough" width={26} height={26} />
            <span className="font-semibold text-sm text-slate-800 tracking-tight">FollowThrough</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <GmailBtn />

            {/* Avatar / email */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold uppercase">
                {userEmail[0]}
              </div>
              <button
                onClick={signOut}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex safe-area-bottom">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
              pathname === href ? 'text-violet-600' : 'text-slate-400'
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-400"
        >
          <LogOut size={19} />
          Sign out
        </button>
      </nav>
    </div>
  )
}
