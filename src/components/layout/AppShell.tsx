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
import { PageTransition } from '@/components/PageTransition'

interface GmailStatus {
  connected: boolean
  connection: { gmail_email: string } | null
}

function useGmail() {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [scanning, setScanning] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const refreshStatus = () =>
    fetch('/api/gmail/scan').then(r => r.json()).then(setStatus).catch(() => {})

  useEffect(() => {
    refreshStatus()

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'gmail-connected') {
        setConnecting(false)
        toast.success('Gmail connected!')
        refreshStatus()
      } else if (e.data?.type === 'gmail-error') {
        setConnecting(false)
        toast.error('Gmail connection failed')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const connect = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/gmail/connect')
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error('Failed to start OAuth')
      const w = window.open(data.url, 'gmail-oauth', 'width=500,height=650,left=200,top=100')
      if (!w) window.location.href = data.url
    } catch {
      setConnecting(false)
      toast.error('Could not open Google sign-in')
    }
  }

  const scan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/gmail/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.loops_created} new loop${data.loops_created !== 1 ? 's' : ''} detected`)
      refreshStatus()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return { status, scanning, connecting, connect, scan }
}

/** Desktop header chip — clear connected/disconnected state, one tap to act */
function GmailChip() {
  const { status, scanning, connecting, connect, scan } = useGmail()
  if (!status) return null

  if (!status.connected) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1a1a1a]/55 border border-dashed border-[#1a1a1a]/20 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]/80 transition-all disabled:opacity-50"
      >
        {connecting ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
        {connecting ? 'Opening…' : 'Connect Gmail'}
      </button>
    )
  }

  return (
    <button
      onClick={scan}
      disabled={scanning}
      title={status.connection?.gmail_email}
      className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-lg text-xs font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-colors disabled:opacity-50"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className={cn('absolute inline-flex h-full w-full rounded-full bg-[#27AE60]/50', scanning && 'animate-ping')} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#27AE60]" />
      </span>
      {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      {scanning ? 'Scanning…' : 'Scan Gmail'}
    </button>
  )
}

/** Mobile bottom-tab variant — icon + status dot + short label */
function GmailTab() {
  const { status, scanning, connecting, connect, scan } = useGmail()
  if (!status) return null
  const connected = status.connected
  const busy = scanning || connecting

  return (
    <button
      onClick={connected ? scan : connect}
      disabled={busy}
      className="flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-60"
    >
      <span className="relative">
        {busy ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white',
            connected ? 'bg-[#27AE60]' : 'bg-[#1a1a1a]/20'
          )}
        />
      </span>
      Gmail
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
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full hover:bg-[#1a1a1a]/6 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/8 text-[#1a1a1a]/70 text-xs font-bold flex items-center justify-center">
          {initial}
        </div>
        <ChevronDown size={13} className={cn('text-[#1a1a1a]/35 transition-transform hidden sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#1a1a1a]/10 shadow-lg py-1.5 z-50">
          <div className="px-3 py-2 border-b border-[#1a1a1a]/6 mb-1">
            <p className="text-xs font-semibold text-[#1a1a1a]/80 truncate">{userEmail}</p>
            <p className="text-[10px] text-[#1a1a1a]/35 mt-0.5">Free plan</p>
          </div>
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a] transition-colors"
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

const NAV = [
  { href: '/dashboard', label: 'Board', icon: LayoutDashboard },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle2 },
] as const

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  const signOut = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#1a1a1a]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-1">
            <Image src="/logo.svg" alt="" width={24} height={24} className="rounded-md" />
            <span className="font-semibold text-sm text-[#1a1a1a] tracking-tight hidden sm:block">FollowThrough</span>
          </Link>

          {/* Divider — desktop only, nav lives in bottom tabs on mobile */}
          <div className="h-5 w-px bg-[#1a1a1a]/10 hidden md:block" />

          {/* Primary nav — segmented pill, desktop only */}
          <nav className="hidden md:flex items-center gap-0.5 bg-[#1a1a1a]/5 rounded-lg p-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-white text-[#1a1a1a] shadow-sm'
                    : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]/80'
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <div className="hidden md:block">
              <GmailChip />
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white text-xs font-semibold hover:bg-[#1a1a1a]/85 transition-colors shadow-sm"
            >
              <Plus size={13} />
              Add Loop
            </button>

            <UserMenu userEmail={userEmail} onSignOut={signOut} />
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 pb-28 md:pb-10">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile bottom nav — the single source of nav + primary actions on small screens */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#1a1a1a]/8 flex safe-area-bottom">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
              pathname === href ? 'text-[#1a1a1a]' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setAddOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-[#1a1a1a]"
        >
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center -mt-1.5 shadow-md">
            <Plus size={18} />
          </div>
        </button>
        <GmailTab />
      </nav>

      <AddLoopDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
