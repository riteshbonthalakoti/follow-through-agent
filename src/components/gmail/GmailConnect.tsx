'use client'

import { useState, useEffect } from 'react'
import { Mail, CheckCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GmailStatus {
  connected: boolean
  connection: { gmail_email: string; last_scanned_at: string | null } | null
}

export function GmailConnect() {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    fetch('/api/gmail/scan')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})

    // Show toast if redirected back from OAuth
    const params = new URLSearchParams(window.location.search)
    const gmailParam = params.get('gmail')
    if (gmailParam === 'connected') {
      toast.success('Gmail connected! Run a scan to detect loops.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (gmailParam === 'error') {
      toast.error('Gmail connection failed. Try again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleScan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/gmail/scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Scan complete — ${data.loops_created} new loop${data.loops_created !== 1 ? 's' : ''} detected`)
      // Refresh status
      const s = await fetch('/api/gmail/scan').then((r) => r.json())
      setStatus(s)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  if (!status) return null

  const handleConnect = async () => {
    const res = await fetch('/api/gmail/connect')
    const data = await res.json()
    if (!data.url) { toast.error('Could not start Gmail connect'); return }
    const popup = window.open(data.url, 'gmail-oauth', 'width=500,height=650,left=200,top=100')
    // Poll until popup closes, then re-fetch status
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer)
        const s = await fetch('/api/gmail/scan').then(r => r.json()).catch(() => null)
        if (s) setStatus(s)
        if (s?.connected) toast.success('Gmail connected!')
      }
    }, 800)
  }

  if (!status.connected) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#71717a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors w-full"
      >
        <Mail size={16} />
        <span>Connect Gmail</span>
      </button>
    )
  }

  return (
    <div className="px-3 space-y-1">
      <div className="flex items-center gap-2 px-3 py-1">
        <CheckCircle size={12} className="text-[#22c55e] shrink-0" />
        <span className="text-[10px] text-[#71717a] truncate">{status.connection?.gmail_email}</span>
      </div>
      <button
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#71717a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors w-full disabled:opacity-50"
      >
        {scanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        <span>{scanning ? 'Scanning...' : 'Scan Gmail'}</span>
      </button>
    </div>
  )
}
