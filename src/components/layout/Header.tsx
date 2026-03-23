'use client'

import { Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
        </div>
        <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {session?.user?.name?.[0] ?? 'U'}
        </div>
      </div>
    </header>
  )
}
