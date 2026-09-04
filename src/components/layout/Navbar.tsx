'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard',  label: 'Loops' },
  { href: '/approvals',  label: 'Approvals' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-slate-800 bg-[#0f0f0f] px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white">
        <span>🔁</span>
        <span className="hidden sm:inline">Follow-Through</span>
      </Link>
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
