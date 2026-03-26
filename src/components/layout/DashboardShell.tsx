'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface DashboardShellProps {
  title: string
  children: React.ReactNode
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        {/* pb-28 でボトムナビ＋iPhoneホームバー分の余白を確保（スマホのみ） */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  )
}
