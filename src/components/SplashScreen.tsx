'use client'

import { useEffect, useState } from 'react'

// Only shown when running as installed PWA (standalone mode)
export function SplashScreen() {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'exit'>('hidden')

  useEffect(() => {
    // Only run in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (!isStandalone) return

    // Skip if already shown this session
    if (sessionStorage.getItem('splash-shown')) return

    setPhase('show')
    sessionStorage.setItem('splash-shown', '1')

    // Begin exit after 2.2s
    const t1 = setTimeout(() => setPhase('exit'), 2200)
    // Unmount after exit animation completes
    const t2 = setTimeout(() => setPhase('hidden'), 2800)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8F7F4]"
      style={{
        transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        pointerEvents: phase === 'exit' ? 'none' : 'auto',
      }}
    >
      {/* Logo mark with draw animation */}
      <div className="relative">
        <svg
          width="76"
          height="76"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="splash-logo"
        >
          {/* Near-black rounded square bg */}
          <rect width="100" height="100" rx="24" fill="#1a1a1a" className="splash-bg" />

          {/* Outer arc */}
          <circle
            cx="50" cy="50" r="30"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="150 38"
            transform="rotate(-38 50 50)"
            className="splash-arc"
          />

          {/* Arrow tip */}
          <path
            d="M74 25 L83 33 L72 36"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="splash-arrow"
          />

          {/* Checkmark — draws last */}
          <path
            d="M34 51 L45 63 L68 38"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="splash-check"
          />
        </svg>
      </div>

      {/* Wordmark fades in after logo */}
      <div className="mt-6 splash-wordmark text-center">
        <p className="text-[#1a1a1a] font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>FollowThrough</p>
        <p className="text-[#1a1a1a]/40 text-xs mt-0.5">Nothing falls through the cracks</p>
      </div>

      <style>{`
        .splash-logo {
          animation: splashScale 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes splashScale {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        .splash-bg {
          animation: bgFade 0.4s ease forwards;
        }
        @keyframes bgFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .splash-arc {
          stroke-dasharray: 0 200;
          animation: drawArc 0.7s 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes drawArc {
          to { stroke-dasharray: 150 38; }
        }

        .splash-arrow {
          opacity: 0;
          animation: fadeIn 0.3s 0.9s ease forwards;
        }

        .splash-check {
          stroke-dasharray: 0 60;
          animation: drawCheck 0.45s 0.95s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes drawCheck {
          to { stroke-dasharray: 60 0; }
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .splash-wordmark {
          opacity: 0;
          transform: translateY(8px);
          animation: wordmarkIn 0.45s 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes wordmarkIn {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
