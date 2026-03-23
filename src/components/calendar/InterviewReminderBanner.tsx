'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, X, Clock, CheckCircle } from 'lucide-react'

type TodayInterview = {
  id: string
  interviewDateTime: string
  candidateId: string
  candidateName: string
  projectTitle: string | null
  interviewer: string | null
}

interface Props {
  todayInterviews: TodayInterview[]
}

type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function InterviewReminderBanner({ todayInterviews }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [permission, setPermission] = useState<NotifPermission>('default')
  const [notifSent, setNotifSent] = useState(false)

  useEffect(() => {
    // ブラウザ通知対応チェック
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as NotifPermission)
  }, [])

  // 通知許可を要求して、今日の面談を通知
  async function requestAndNotify() {
    if (!('Notification' in window)) return

    const result = await Notification.requestPermission()
    setPermission(result as NotifPermission)

    if (result === 'granted') {
      sendNotifications()
    }
  }

  function sendNotifications() {
    if (todayInterviews.length === 0) return

    // まとめ通知
    const title = `📅 本日の面談 ${todayInterviews.length}件`
    const body = todayInterviews
      .map((iv) => `${formatTime(iv.interviewDateTime)} ${iv.candidateName}`)
      .join('\n')

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'today-interviews',
        requireInteraction: true,
      })

      notif.onclick = () => {
        window.focus()
        notif.close()
      }

      setNotifSent(true)
    } catch {
      console.warn('通知の送信に失敗しました')
    }
  }

  // 許可済みで初回マウント時に自動通知
  useEffect(() => {
    if (
      permission === 'granted' &&
      todayInterviews.length > 0 &&
      !notifSent
    ) {
      // 少し遅延して通知（UX改善）
      const timer = setTimeout(() => {
        sendNotifications()
      }, 1500)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission])

  // 今日の面談がない場合は何も表示しない
  if (todayInterviews.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <CheckCircle className="w-4 h-4 text-green-400" />
        本日の面談予定はありません
        <ReminderPermissionButton
          permission={permission}
          onRequest={requestAndNotify}
          compact
        />
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="bg-blue-600 text-white rounded-xl p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm mb-2">
              📅 本日の面談 {todayInterviews.length}件
            </p>
            <div className="space-y-1.5">
              {todayInterviews.map((iv) => (
                <Link
                  key={iv.id}
                  href={`/candidates/${iv.candidateId}`}
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-blue-200" />
                  <span className="font-medium text-white">
                    {formatTime(iv.interviewDateTime)}
                  </span>
                  <span>{iv.candidateName}</span>
                  {iv.projectTitle && (
                    <span className="text-blue-200 text-xs truncate">
                      — {iv.projectTitle}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 通知ボタン */}
          <ReminderPermissionButton
            permission={permission}
            onRequest={requestAndNotify}
            notifSent={notifSent}
          />
          {/* 閉じるボタン */}
          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white transition-colors"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReminderPermissionButton({
  permission,
  onRequest,
  notifSent,
  compact,
}: {
  permission: NotifPermission
  onRequest: () => void
  notifSent?: boolean
  compact?: boolean
}) {
  if (permission === 'unsupported') return null

  if (permission === 'granted') {
    return (
      <span className={`flex items-center gap-1 text-xs ${compact ? 'text-green-600' : 'text-white/70'}`}>
        <Bell className="w-3.5 h-3.5" />
        {notifSent ? '通知送信済み' : '通知ON'}
      </span>
    )
  }

  if (permission === 'denied') {
    return (
      <span className={`flex items-center gap-1 text-xs ${compact ? 'text-gray-400' : 'text-white/60'}`}
        title="ブラウザの設定から通知を許可してください">
        <BellOff className="w-3.5 h-3.5" />
        通知OFF
      </span>
    )
  }

  // default: まだ許可していない
  return (
    <button
      onClick={onRequest}
      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
        compact
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-white/20 hover:bg-white/30 text-white'
      }`}
    >
      <Bell className="w-3.5 h-3.5" />
      リマインド通知をON
    </button>
  )
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
