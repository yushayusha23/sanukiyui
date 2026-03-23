'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, User, Briefcase } from 'lucide-react'
import { InterviewResultBadge } from '@/components/ui/StatusBadge'

type Interview = {
  id: string
  interviewDateTime: string
  candidateId: string
  candidateName: string
  projectTitle: string | null
  projectId: string | null
  interviewer: string | null
  result: string | null
  memo: string | null
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarView({ interviews }: { interviews: Interview[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().split('T')[0]
  )

  // 月のカレンダーグリッドを生成
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay() // 0=日
    const days: (Date | null)[] = []

    // 前月の空白
    for (let i = 0; i < startDow; i++) days.push(null)
    // 当月の日付
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }
    // 後月の空白（6行になるよう埋める）
    while (days.length % 7 !== 0) days.push(null)

    return days
  }, [year, month])

  // 日付ごとの面談マップ
  const interviewsByDate = useMemo(() => {
    const map: Record<string, Interview[]> = {}
    for (const iv of interviews) {
      const dateKey = iv.interviewDateTime.split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(iv)
    }
    return map
  }, [interviews])

  // 選択日の面談
  const selectedInterviews = selectedDate ? (interviewsByDate[selectedDate] ?? []) : []

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(today.toISOString().split('T')[0])
  }

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* カレンダー本体 */}
      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">
                {year}年 {month + 1}月
              </h2>
              <button
                onClick={goToday}
                className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors"
              >
                今日
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={`py-2 text-center text-xs font-semibold ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {calendarDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="min-h-[72px] bg-gray-50/50" />
              }

              const dateStr = date.toISOString().split('T')[0]
              const dayInterviews = interviewsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const isPast = date < today && !isToday
              const dow = date.getDay()

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[72px] p-1.5 flex flex-col items-start transition-colors text-left border-b border-gray-100 ${
                    isSelected
                      ? 'bg-blue-50'
                      : isToday
                      ? 'bg-blue-50/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* 日付番号 */}
                  <span
                    className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-blue-200 text-blue-800'
                        : dow === 0
                        ? 'text-red-500'
                        : dow === 6
                        ? 'text-blue-500'
                        : isPast
                        ? 'text-gray-400'
                        : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {/* 面談バッジ */}
                  <div className="w-full space-y-0.5">
                    {dayInterviews.slice(0, 2).map((iv) => (
                      <div
                        key={iv.id}
                        className={`text-xs px-1 py-0.5 rounded truncate w-full ${
                          isPast
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {formatTimeShort(iv.interviewDateTime)} {iv.candidateName}
                      </div>
                    ))}
                    {dayInterviews.length > 2 && (
                      <div className="text-xs text-gray-400 pl-1">
                        +{dayInterviews.length - 2}件
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 月間サマリー */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 px-1">
          <span>
            今月の面談:&nbsp;
            <strong className="text-blue-600">
              {
                interviews.filter((iv) => {
                  const d = new Date(iv.interviewDateTime)
                  return d.getFullYear() === year && d.getMonth() === month
                }).length
              }
            </strong>
            件
          </span>
          <span>
            今月の予定:&nbsp;
            <strong className="text-green-600">
              {
                interviews.filter((iv) => {
                  const d = new Date(iv.interviewDateTime)
                  return (
                    d.getFullYear() === year &&
                    d.getMonth() === month &&
                    d >= today
                  )
                }).length
              }
            </strong>
            件
          </span>
        </div>
      </div>

      {/* 右サイド: 選択日の詳細 */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            {selectedDate
              ? formatDateJa(selectedDate)
              : '日付を選択してください'}
            {selectedDate === todayStr && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                今日
              </span>
            )}
          </h3>

          {selectedInterviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              面談予定はありません
            </p>
          ) : (
            <div className="space-y-3">
              {selectedInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className={`border rounded-lg p-3 ${
                    new Date(iv.interviewDateTime) >= today
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimeShort(iv.interviewDateTime)}
                    </div>
                    <InterviewResultBadge result={iv.result} />
                  </div>

                  <Link
                    href={`/candidates/${iv.candidateId}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {iv.candidateName}
                  </Link>

                  {iv.projectTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Briefcase className="w-3 h-3" />
                      {iv.projectTitle}
                    </div>
                  )}

                  {iv.interviewer && (
                    <p className="text-xs text-gray-500 mt-1">
                      担当: {iv.interviewer}
                    </p>
                  )}

                  {iv.memo && (
                    <p className="text-xs text-gray-600 mt-1.5 bg-white rounded p-1.5 border border-gray-100">
                      {iv.memo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href={`/interviews/new${selectedDate ? `?date=${selectedDate}` : ''}`}
              className="btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
            >
              + この日に面談を追加
            </Link>
          </div>
        </div>

        {/* 凡例 */}
        <div className="card p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">凡例</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-gray-600">今日</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-12 h-4 rounded bg-blue-100 text-blue-700 flex items-center px-1 text-xs">
                予定
              </div>
              <span className="text-gray-600">今後の面談</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-12 h-4 rounded bg-gray-100 text-gray-500 flex items-center px-1 text-xs">
                済み
              </div>
              <span className="text-gray-600">過去の面談</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTimeShort(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateJa(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`
}
