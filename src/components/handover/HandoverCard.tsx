'use client'

import { useTransition } from 'react'
import { toggleHandoverStatus, deleteHandoverNote } from '@/lib/actions/handover'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'

type Props = {
  id: string
  title: string
  body: string | null
  assignee: string | null
  status: string
  createdAt: string
}

export function HandoverCard({ id, title, body, assignee, status, createdAt }: Props) {
  const [pending, startTransition] = useTransition()
  const isDone = status === 'DONE'

  return (
    <div className={`card p-4 flex gap-3 ${isDone ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => startTransition(() => toggleHandoverStatus(id, status))}
        disabled={pending}
        className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
      >
        {isDone
          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
          : <Circle className="w-5 h-5" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-gray-900 ${isDone ? 'line-through text-gray-400' : ''}`}>
            {title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isDone
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isDone ? '済み' : '未対応'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!confirm('削除しますか？')) return
                startTransition(() => deleteHandoverNote(id))
              }}
              disabled={pending}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {body && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{body}</p>}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          {assignee && <span>担当: {assignee}</span>}
          <span>{new Date(createdAt).toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
    </div>
  )
}
