'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckCircle, RefreshCw, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Loop Board', icon: LayoutDashboard },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/dashboard?scan=1', label: 'Run Scan', icon: RefreshCw, exact: false },
]

interface SidebarProps {
  userEmail: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname === base
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#0f0f0f] border-r border-[#1a1a1a]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a1a1a]">
        <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">F</span>
        </div>
        <span className="text-[#f5f5f5] font-semibold text-sm tracking-tight">FollowThrough</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-[#71717a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]'
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1a1a1a]">
        <p className="text-[#71717a] text-xs px-3 mb-3 truncate">{userEmail}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#71717a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors w-full"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
