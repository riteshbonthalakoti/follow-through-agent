'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-dismissed' // permanent — user explicitly closed it
const SNOOZE_KEY = 'pwa-snoozed-until' // temporary — "Not now", re-ask after a few days
const SNOOZE_DAYS = 4

export function PWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem(DISMISS_KEY)) return

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0)
    if (snoozedUntil && Date.now() < snoozedUntil) return

    // iOS Safari — no beforeinstallprompt, show manual instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
    if (ios) {
      setIsIOS(true)
      const t = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(t)
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
    if (outcome === 'accepted') {
      setInstalled(true)
      localStorage.setItem(DISMISS_KEY, '1')
      setTimeout(() => setVisible(false), 1600)
    }
    setPrompt(null)
  }

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000))
    setVisible(false)
  }

  const dismissForever = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
    >
      <div
        className="glass-card rounded-2xl p-4 max-w-lg mx-auto"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        {installed ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-[#27AE60] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-semibold text-[#1a1a1a]">Installed — opening FollowThrough…</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm">
              <Image src="/icons/icon-192x192.png" alt="FollowThrough" width={48} height={48} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a]">Install FollowThrough</p>
              {isIOS ? (
                <p className="text-xs text-[#1a1a1a]/45 mt-0.5 leading-relaxed">
                  Tap <strong className="text-[#1a1a1a]/70">Share</strong> <Share size={10} className="inline -mt-0.5" /> then <strong className="text-[#1a1a1a]/70">Add to Home Screen</strong>
                </p>
              ) : (
                <p className="text-xs text-[#1a1a1a]/45 mt-0.5">Works offline · Feels like a native app</p>
              )}
              <button onClick={snooze} className="text-[11px] font-medium text-[#1a1a1a]/35 hover:text-[#1a1a1a]/60 mt-1 transition-colors">
                Not now
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-xs font-semibold hover:bg-[#1a1a1a]/85 transition-colors"
                >
                  <Download size={12} />
                  Install
                </button>
              )}
              <button
                onClick={dismissForever}
                aria-label="Dismiss"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#1a1a1a]/35 hover:bg-[#1a1a1a]/6 hover:text-[#1a1a1a]/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
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
