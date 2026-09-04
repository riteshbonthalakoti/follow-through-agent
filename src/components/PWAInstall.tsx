'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) return

    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl">
      <span className="text-sm text-zinc-300">Install FollowThrough for the full app experience</span>
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="text-zinc-600 hover:text-zinc-400 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
