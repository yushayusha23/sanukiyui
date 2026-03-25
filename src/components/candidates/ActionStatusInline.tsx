'use client'

import { useTransition } from 'react'
import { updateActionStatus } from '@/lib/actions/candidates'
import { ACTION_STATUS_MAP } from '@/components/ui/StatusBadge'

const OPTIONS = [
  { value: '', label: 'アクションなし' },
  { value: 'PROPOSAL_NEEDED', label: '🔴 提案必要！' },
  { value: 'WAITING_CANDIDATE', label: '🟡 人材元返信待ち' },
  { value: 'WAITING_CLIENT', label: '🔵 案件先返信待ち' },
]

export function ActionStatusInline({
  candidateId,
  current,
}: {
  candidateId: string
  current: string | null
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    startTransition(() => {
      updateActionStatus(candidateId, val || null)
    })
  }

  const s = current ? ACTION_STATUS_MAP[current] : null

  return (
    <div className="relative group">
      {/* バッジ表示 (通常時) */}
      <div className={`cursor-pointer transition-opacity ${isPending ? 'opacity-40' : ''}`}>
        {s ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap border ${s.color}`}>
            {s.label}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-gray-300 border border-dashed border-gray-200 whitespace-nowrap">
            未設定
          </span>
        )}
      </div>
      {/* ホバーでセレクト表示 */}
      <select
        value={current ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        title="アクションを変更"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
