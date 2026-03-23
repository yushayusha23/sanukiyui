'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, CalendarDays } from 'lucide-react'
import { addInterviewInline, deleteInterviewInline } from '@/lib/actions/interviews'
import { InterviewResultBadge } from '@/components/ui/StatusBadge'
import { INTERVIEW_RESULT } from '@/types'

type InterviewEntry = {
  id: string
  interviewDateTime: string  // ISO文字列
  result: string | null
  interviewer: string | null
  memo: string | null
  evaluation: string | null
  project: { id: string; title: string } | null
}

type AvailableProject = { id: string; title: string }

interface Props {
  candidateId: string
  interviews: InterviewEntry[]
  availableProjects: AvailableProject[]
}

function toDateTimeLocalDefault(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDT(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function InterviewSection({ candidateId, interviews, availableProjects }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => addInterviewInline(fd))
    // フォームをリセット（次の面談をすぐ入力できるように）
    formRef.current?.reset()
    if (formRef.current) {
      const dtInput = formRef.current.querySelector<HTMLInputElement>('input[name="interviewDateTime"]')
      if (dtInput) dtInput.value = toDateTimeLocalDefault()
    }
  }

  function handleDelete(interviewId: string) {
    if (!confirm('この面談記録を削除しますか？')) return
    const fd = new FormData()
    fd.set('interviewId', interviewId)
    fd.set('candidateId', candidateId)
    startTransition(() => deleteInterviewInline(fd))
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="section-title mb-0 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          面談履歴
        </h4>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          面談を追加
        </button>
      </div>

      {/* インライン追加フォーム */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleAdd}
          className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3"
        >
          <p className="text-xs font-semibold text-blue-700">面談を追加</p>
          <input type="hidden" name="candidateId" value={candidateId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 日時 */}
            <div>
              <label className="form-label text-xs">面談日時 <span className="text-red-500">*</span></label>
              <input
                name="interviewDateTime"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocalDefault()}
                className="form-input text-sm"
              />
            </div>

            {/* 関連案件 */}
            <div>
              <label className="form-label text-xs">関連案件（任意）</label>
              <select name="projectId" className="form-select text-sm">
                <option value="">案件を選択...</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* 結果 */}
            <div>
              <label className="form-label text-xs">結果</label>
              <select name="result" defaultValue="PENDING" className="form-select text-sm">
                {Object.entries(INTERVIEW_RESULT).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* 担当者 */}
            <div>
              <label className="form-label text-xs">面談担当者</label>
              <input
                name="interviewer"
                className="form-input text-sm"
                placeholder="田中 花子"
              />
            </div>

            {/* 評価 */}
            <div className="sm:col-span-2">
              <label className="form-label text-xs">評価</label>
              <input
                name="evaluation"
                className="form-input text-sm"
                placeholder="非常に良い / 良い / 普通 / 要検討"
              />
            </div>

            {/* メモ */}
            <div className="sm:col-span-2">
              <label className="form-label text-xs">メモ</label>
              <textarea
                name="memo"
                rows={2}
                className="form-textarea text-sm"
                placeholder="面談内容のメモ..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary btn-sm">
              {pending ? '保存中...' : '登録する'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary btn-sm"
            >
              閉じる
            </button>
          </div>
          <p className="text-xs text-blue-600">登録後もフォームが残るので、続けて別の面談を追加できます</p>
        </form>
      )}

      {/* 面談一覧 */}
      {interviews.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 py-2">面談履歴がありません</p>
      ) : (
        <div className="space-y-2">
          {interviews.map((iv) => (
            <div key={iv.id} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-gray-800">
                    {formatDT(iv.interviewDateTime)}
                  </span>
                  <InterviewResultBadge result={iv.result} />
                </div>
                {iv.project && (
                  <p className="text-xs text-blue-600 mb-0.5">
                    <Link href={`/projects/${iv.project.id}`} className="hover:underline">
                      {iv.project.title}
                    </Link>
                  </p>
                )}
                {iv.interviewer && (
                  <p className="text-xs text-gray-500">担当: {iv.interviewer}</p>
                )}
                {iv.evaluation && (
                  <p className="text-xs text-gray-500">評価: {iv.evaluation}</p>
                )}
                {iv.memo && (
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{iv.memo}</p>
                )}
              </div>

              {/* 操作ボタン */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/interviews/${iv.id}/edit?redirectTo=/candidates/${candidateId}`}
                  className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="編集"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(iv.id)}
                  disabled={pending}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
