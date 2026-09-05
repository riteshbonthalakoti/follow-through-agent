'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckCircle2, LogOut, Mail, RefreshCw, Loader2, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { AddLoopDialog } from '@/components/loops/AddLoopDialog'

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-700 transition-all"
      >
        <Mail size={12} />
        Connect Gmail
      </a>
    )
  }

  return (
    <button
      onClick={scan}
      disabled={scanning}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
    >
      {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      {scanning ? 'Scanning…' : 'Scan Gmail'}
    </button>
  )
}

function UserMenu({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initial = userEmail[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
          {initial}
        </div>
        <ChevronDown size={13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-semibold text-slate-700 truncate">{userEmail}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Free plan</p>
          </div>
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

interface AppShellProps {
  userEmail: string
  children: React.ReactNode
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  const NAV = [
    { href: '/dashboard', label: 'Board', icon: LayoutDashboard },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-2">
            <Image src="/logo.svg" alt="" width={24} height={24} />
            <span className="font-semibold text-sm text-slate-900 tracking-tight hidden sm:block">FollowThrough</span>
          </Link>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <GmailBtn />

            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Add Loop</span>
            </button>

            <UserMenu userEmail={userEmail} onSignOut={signOut} />
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 pb-24 md:pb-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex safe-area-bottom">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
              pathname === href ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setAddOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-violet-600"
        >
          <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center -mt-1 shadow-md">
            <Plus size={18} />
          </div>
        </button>
        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-400"
        >
          <LogOut size={20} />
          Out
        </button>
      </nav>

      <AddLoopDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
