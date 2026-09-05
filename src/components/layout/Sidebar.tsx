'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { GmailConnect } from '@/components/gmail/GmailConnect'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Loop Board', icon: LayoutDashboard },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle },
]

interface SidebarProps {
  userEmail: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => pathname === href.split('?')[0]

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#0f0f0f] border-r border-[#1a1a1a]">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a1a1a]">
          <Image src="/logo.svg" alt="FollowThrough" width={28} height={28} className="shrink-0" />
          <span className="text-[#f5f5f5] font-semibold text-sm tracking-tight">FollowThrough</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive(href)
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-[#71717a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]'
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-[#1a1a1a]">
          <p className="text-[#3f3f46] text-[10px] uppercase tracking-wider px-3 mb-2">Integrations</p>
          <GmailConnect />
        </div>

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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0f0f0f] border-t border-[#1a1a1a] flex items-center safe-area-bottom">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              isActive(href) ? 'text-[#7c3aed]' : 'text-[#71717a]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-[#71717a]"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>
    </>
  )
}
