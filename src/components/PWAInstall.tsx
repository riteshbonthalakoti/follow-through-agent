'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(true) // start hidden

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    setDismissed(false)

    // iOS Safari — no beforeinstallprompt, show manual instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    if (ios) {
      setIsIOS(true)
      setTimeout(() => setVisible(true), 4000)
      return
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setVisible(true), 3500)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
    setPrompt(null)
  }

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (dismissed || !visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 px-4 pb-safe-or-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 flex items-center gap-4 max-w-lg mx-auto"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md">
          <Image src="/icons/icon-192x192.png" alt="FollowThrough" width={48} height={48} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Install FollowThrough</p>
          {isIOS ? (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> for the best experience.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">Works offline · Feels like a native app</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Download size={12} />
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
