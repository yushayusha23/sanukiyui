'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, Calendar, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/',            label: 'ホーム',  icon: LayoutDashboard },
  { href: '/candidates',  label: '人材',    icon: Users },
  { href: '/projects',    label: '案件',    icon: Briefcase },
  { href: '/interviews',  label: '面談',    icon: Calendar },
]

interface Props {
  onMenuClick: () => void
}

export function BottomNav({ onMenuClick }: Props) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-green-950 border-t border-green-900 flex items-stretch h-16 safe-area-pb">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-white' : 'text-green-500'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]')} />
            {label}
          </Link>
        )
      })}
      {/* メニューボタン（サイドバー開く） */}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-green-500 transition-colors"
      >
        <Menu className="w-5 h-5" />
        メニュー
      </button>
    </nav>
  )
}
