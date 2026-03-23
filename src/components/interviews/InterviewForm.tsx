'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { INTERVIEW_RESULT } from '@/types'

type Person = { id: string; name: string }
type Project = { id: string; title: string }

interface InterviewFormProps {
  action: (formData: FormData) => Promise<void>
  candidates: Person[]
  projects: Project[]
  defaultCandidateId?: string
  defaultProjectId?: string
  defaultDate?: string              // YYYY-MM-DD (カレンダーから遷移時)
  defaultInterviewDateTime?: string // ISO文字列 (編集時)
  defaultInterviewer?: string
  defaultResult?: string
  defaultEvaluation?: string
  defaultMemo?: string
  redirectTo?: string
  backHref: string
}

function toDateTimeLocal(defaultDate?: string, defaultDateTime?: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (defaultDateTime) {
    const d = new Date(defaultDateTime)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  if (defaultDate) {
    const d = new Date(defaultDate + 'T10:00:00')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InterviewForm({
  action,
  candidates,
  projects,
  defaultCandidateId,
  defaultProjectId,
  defaultDate,
  defaultInterviewDateTime,
  defaultInterviewer,
  defaultResult,
  defaultEvaluation,
  defaultMemo,
  redirectTo = '/interviews',
  backHref,
}: InterviewFormProps) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="card p-6">
        <h3 className="section-title">面談情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <label className="form-label">関連案件（任意）</label>
            <select
              name="projectId"
              defaultValue={defaultProjectId ?? ''}
              className="form-select"
            >
              <option value="">案件を選択...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              面談日時 <span className="text-red-500">*</span>
            </label>
            <input
              name="interviewDateTime"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(defaultDate, defaultInterviewDateTime)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">面談担当者</label>
            <input
              name="interviewer"
              className="form-input"
              placeholder="田中 花子"
              defaultValue={defaultInterviewer ?? ''}
            />
          </div>

          <div>
            <label className="form-label">結果</label>
            <select name="result" defaultValue={defaultResult ?? 'PENDING'} className="form-select">
              {Object.entries(INTERVIEW_RESULT).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">評価</label>
            <input
              name="evaluation"
              className="form-input"
              placeholder="非常に良い / 良い / 普通 / 要検討"
              defaultValue={defaultEvaluation ?? ''}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">メモ</label>
            <textarea
              name="memo"
              rows={3}
              className="form-textarea"
              placeholder="面談内容のメモ..."
              defaultValue={defaultMemo ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '保存中...' : '登録する'}
        </button>
        <Link href={backHref} className="btn-secondary">キャンセル</Link>
      </div>
    </form>
  )
}
