'use client'

import { useTransition, useState } from 'react'
import { CONTACT_TYPE } from '@/types'

type Person = { id: string; name: string }

interface CommunicationFormProps {
  action: (formData: FormData) => Promise<void>
  candidates: Person[]
  defaultCandidateId?: string
  redirectTo?: string
}

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function CommunicationForm({
  action,
  candidates,
  defaultCandidateId,
  redirectTo = '/communications',
}: CommunicationFormProps) {
  const [pending, startTransition] = useTransition()
  const [replied, setReplied] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('replied', replied ? 'true' : 'false')
    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="form-label">
            求職者 <span className="text-red-500">*</span>
          </label>
          <select
            name="candidateId"
            required
            defaultValue={defaultCandidateId ?? ''}
            className="form-select"
          >
            <option value="">求職者を選択...</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">連絡手段</label>
          <select name="type" defaultValue="PHONE" className="form-select">
            {Object.entries(CONTACT_TYPE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">連絡日時</label>
          <input
            name="contactedAt"
            type="datetime-local"
            defaultValue={todayISO()}
            className="form-input"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="form-label">内容メモ</label>
          <textarea
            name="memo"
            rows={2}
            className="form-textarea"
            placeholder="連絡内容の概要..."
          />
        </div>

        <div>
          <label className="form-label">次回連絡予定日</label>
          <input
            name="nextContactDate"
            type="date"
            className="form-input"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={replied}
            onChange={(e) => setReplied(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">返信あり（済み）</span>
        </label>

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '記録中...' : '連絡を記録'}
        </button>
      </div>
    </form>
  )
}
