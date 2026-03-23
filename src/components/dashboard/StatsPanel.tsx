'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Briefcase, CalendarDays, Send, CheckCircle2, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

export type StatsData = {
  candidates: number
  projects: number
  interviews: number
  proposals: number
  applications: number
  passed: number
  failed: number
}

interface Props {
  initialMonthly: StatsData
  allTime: StatsData
  initialYear: number
  initialMonth: number  // 1-12
}

type Tab = 'monthly' | 'allTime'

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(year: number, month: number) {
  return `${year}年${month}月`
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-100' },
  yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-600',  border: 'border-yellow-100' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
}

export function StatsPanel({ initialMonthly, allTime, initialYear, initialMonth }: Props) {
  const FALLBACK: StatsData = { candidates: 0, projects: 0, interviews: 0, proposals: 0, applications: 0, passed: 0, failed: 0 }
  const [tab, setTab] = useState<Tab>('monthly')
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear())
  const [month, setMonth] = useState(initialMonth ?? new Date().getMonth() + 1)
  const [monthly, setMonthly] = useState<StatsData>(initialMonthly ?? FALLBACK)
  const [loading, setLoading] = useState(false)

  // 現在月より未来には進めない
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?month=${toMonthKey(y, m)}`)
      if (res.ok) {
        const data = await res.json()
        setMonthly(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function prevMonth() {
    let y = year, m = month - 1
    if (m < 1) { m = 12; y -= 1 }
    setYear(y); setMonth(m)
    fetchMonth(y, m)
    setTab('monthly')
  }

  function nextMonth() {
    if (isCurrentMonth) return
    let y = year, m = month + 1
    if (m > 12) { m = 1; y += 1 }
    setYear(y); setMonth(m)
    fetchMonth(y, m)
    setTab('monthly')
  }

  function goToCurrentMonth() {
    const cy = now.getFullYear(), cm = now.getMonth() + 1
    setYear(cy); setMonth(cm)
    setMonthly(initialMonthly)
    setTab('monthly')
  }

  const EMPTY: StatsData = { candidates: 0, projects: 0, interviews: 0, proposals: 0, applications: 0, passed: 0, failed: 0 }
  const d = (tab === 'allTime' ? allTime : monthly) ?? EMPTY
  const passRate = (d.passed + d.failed) > 0
    ? Math.round((d.passed / (d.passed + d.failed)) * 100)
    : null

  const stats = [
    {
      label: tab === 'allTime' ? '求職者総数' : '新規求職者',
      value: d.candidates,
      icon: <Users className="w-4 h-4" />,
      color: 'blue',
      href: '/candidates',
      unit: '名',
    },
    {
      label: tab === 'allTime' ? '案件総数' : '新規案件',
      value: d.projects,
      icon: <Briefcase className="w-4 h-4" />,
      color: 'indigo',
      href: '/projects',
      unit: '件',
    },
    {
      label: '面談数',
      value: d.interviews,
      icon: <CalendarDays className="w-4 h-4" />,
      color: 'green',
      href: '/interviews',
      unit: '件',
    },
    {
      label: '提案数',
      value: d.proposals,
      icon: <Send className="w-4 h-4" />,
      color: 'yellow',
      href: '/candidates',
      unit: '件',
    },
    {
      label: '応募数',
      value: d.applications,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'orange',
      href: '/candidates',
      unit: '件',
    },
    {
      label: '面談通過',
      value: d.passed,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'emerald',
      href: '/interviews',
      unit: '件',
      sub: passRate !== null ? `合格率 ${passRate}%` : undefined,
    },
  ]

  return (
    <div className="card p-4 mb-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="section-title mb-0 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          実績サマリー
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 月ナビゲーション */}
          {tab === 'monthly' && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
              <button
                onClick={prevMonth}
                disabled={loading}
                className="p-1 rounded hover:bg-white transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-40"
                title="前の月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={goToCurrentMonth}
                className={`px-2 py-1 text-sm font-medium min-w-[90px] text-center transition-colors rounded ${
                  isCurrentMonth ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
                title="今月に戻る"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  monthLabel(year, month)
                )}
              </button>

              <button
                onClick={nextMonth}
                disabled={loading || isCurrentMonth || isFuture}
                className="p-1 rounded hover:bg-white transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-30"
                title="次の月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 月次 / 全期間 トグル */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm">
            <button
              onClick={() => setTab('monthly')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tab === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              月次
            </button>
            <button
              onClick={() => setTab('allTime')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                tab === 'allTime'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全期間
            </button>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map((s) => {
          const c = colorMap[s.color]
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`rounded-xl border ${c.border} ${c.bg} p-3 hover:opacity-80 transition-opacity text-center ${loading && tab === 'monthly' ? 'opacity-50' : ''}`}
            >
              <div className={`${c.text} flex justify-center mb-1`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${c.text}`}>{s.value}</p>
              <p className={`text-xs font-medium ${c.text} opacity-80`}>{s.unit}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
              {s.sub && (
                <p className={`text-xs font-semibold ${c.text} mt-0.5`}>{s.sub}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
