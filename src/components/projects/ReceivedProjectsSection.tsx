'use client'

import { useState, useTransition, useRef } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Building2, AlertTriangle } from 'lucide-react'
import { addReceivedProject, deleteReceivedProject } from '@/lib/actions/receivedProjects'

type ReceivedProject = {
  id: string
  sourceName: string
  title: string | null
  description: string | null
  memo: string | null
  receivedAt: string  // ISO
}

interface Props {
  projectId: string
  projectTitle: string  // 自社版タイトル（比較用）
  received: ReceivedProject[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export function ReceivedProjectsSection({ projectId, projectTitle, received }: Props) {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const hasDuplicate = received.length >= 2  // 2社以上 = 同一案件

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => addReceivedProject(fd))
    formRef.current?.reset()
    setShowForm(false)
  }

  function handleDelete(id: string) {
    if (!confirm('この受信案件を削除しますか？')) return
    const fd = new FormData()
    fd.set('id', id)
    fd.set('projectId', projectId)
    startTransition(() => deleteReceivedProject(fd))
  }

  return (
    <div className="card p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Building2 className="w-4 h-4 text-gray-500" />
            もらった案件（受信版）
            <span className="text-xs font-normal text-gray-400">
              {received.length > 0 ? `${received.length}社` : 'なし'}
            </span>
            {open
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </button>

          {/* 同一案件バッジ */}
          {hasDuplicate && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              <AlertTriangle className="w-3 h-3" />
              同一案件あり（{received.length}社）
            </span>
          )}
          {received.length === 1 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {received[0].sourceName} より受信
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setOpen(true); setShowForm((v) => !v) }}
          className="btn-secondary btn-sm flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>

      {/* コンテンツ（トグル） */}
      {open && (
        <div className="mt-4 space-y-3">
          {/* 追加フォーム */}
          {showForm && (
            <form
              ref={formRef}
              onSubmit={handleAdd}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3"
            >
              <p className="text-xs font-semibold text-blue-700">受信案件を追加</p>
              <input type="hidden" name="projectId" value={projectId} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">
                    送り元会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="sourceName"
                    required
                    className="form-input text-sm"
                    placeholder="株式会社〇〇"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">受信日</label>
                  <input
                    name="receivedAt"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="form-input text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label text-xs">原文タイトル（自社版と異なる場合）</label>
                  <input
                    name="title"
                    className="form-input text-sm"
                    placeholder={projectTitle}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label text-xs">原文内容</label>
                  <textarea
                    name="description"
                    rows={4}
                    className="form-textarea text-sm font-mono"
                    placeholder="送られてきた原文をそのままペースト..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label text-xs">メモ</label>
                  <input
                    name="memo"
                    className="form-input text-sm"
                    placeholder="気づいた点など..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={pending} className="btn-primary btn-sm">
                  {pending ? '保存中...' : '登録'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary btn-sm"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {/* 受信案件一覧 */}
          {received.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 py-2">受信案件が登録されていません</p>
          )}

          {received.map((r, i) => (
            <div
              key={r.id}
              className={`rounded-lg border p-4 ${
                hasDuplicate
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    hasDuplicate
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {hasDuplicate ? `同一案件 ${i + 1}` : '受信版'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{r.sourceName}</span>
                  <span className="text-xs text-gray-400">{formatDate(r.receivedAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  disabled={pending}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 flex-shrink-0"
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* タイトルが自社版と異なる場合 */}
              {r.title && r.title !== projectTitle && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-0.5">原文タイトル</p>
                  <p className="text-sm font-medium text-gray-700">{r.title}</p>
                </div>
              )}

              {r.description && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-0.5">原文内容</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-white rounded p-2 border border-gray-100 max-h-48 overflow-y-auto">
                    {r.description}
                  </pre>
                </div>
              )}

              {r.memo && (
                <p className="text-xs text-blue-600 mt-1">📝 {r.memo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
