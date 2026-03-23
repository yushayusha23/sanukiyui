'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  CalendarDays,
  MessageSquare,
  BarChart2,
  FileText,
  ClipboardList,
  Building2,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/candidates', label: '人材管理', icon: Users },
  { href: '/projects', label: '案件管理', icon: Briefcase },
  { href: '/interviews', label: '面談管理', icon: Calendar },
  { href: '/calendar', label: '面談カレンダー', icon: CalendarDays },
  // { href: '/progress', label: '進捗管理', icon: BarChart2 },
  { href: '/templates', label: 'テンプレート', icon: FileText },
  { href: '/clients', label: 'クライアント', icon: Building2 },
  { href: '/handover', label: '引き継ぎ', icon: ClipboardList },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* オーバーレイ (モバイル) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-green-950 text-white z-50 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-green-900">
          <div>
            <h1 className="text-sm font-bold leading-tight">🦕 人材BPO</h1>
            <p className="text-xs text-green-400">管理システム</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-green-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-green-300 hover:bg-green-900 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* 恐竜デコ */}
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-green-700 tracking-widest">🦕 🦖 🦕 🦖 🦕</p>
        </div>

        {/* ログアウト */}
        <div className="p-3 border-t border-green-900">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-green-300 hover:bg-green-900 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </aside>
    </>
  )
}
