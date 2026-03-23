'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Briefcase, Plus, X, ChevronDown } from 'lucide-react'
import { upsertMatch, updateMatchStatus, deleteMatch } from '@/lib/actions/matches'
import { InterviewResultBadge } from '@/components/ui/StatusBadge'

type MatchStatus = 'SUGGESTED' | 'ACCEPTED' | 'REJECTED'

type ProjectEntry = {
  matchId: string
  projectId: string
  projectTitle: string
  clientName: string | null
  matchStatus: MatchStatus
  interviewResult: string | null   // PENDING | PASSED | FAILED | ON_HOLD | null
  interviewDateTime: string | null
}

type AvailableProject = {
  id: string
  title: string
  clientName: string | null
}

interface Props {
  candidateId: string
  entries: ProjectEntry[]
  availableProjects: AvailableProject[]
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  SUGGESTED: '提案中',
  ACCEPTED: '応募済み',
  REJECTED: 'NG',
}

const STATUS_COLORS: Record<MatchStatus, string> = {
  SUGGESTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_BORDER: Record<MatchStatus, string> = {
  SUGGESTED: 'border-l-yellow-400',
  ACCEPTED: 'border-l-blue-400',
  REJECTED: 'border-l-red-300',
}

export function ProjectLinksSection({ candidateId, entries, availableProjects }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [pending, startTransition] = useTransition()

  // ステータス別に分類
  const suggested = entries.filter((e) => e.matchStatus === 'SUGGESTED')
  const accepted = entries.filter((e) => e.matchStatus === 'ACCEPTED')
  const rejected = entries.filter((e) => e.matchStatus === 'REJECTED')

  function handleUpsert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => upsertMatch(fd))
    setShowAddForm(false)
  }

  function handleStatusChange(matchId: string, status: MatchStatus) {
    const fd = new FormData()
    fd.set('matchId', matchId)
    fd.set('status', status)
    fd.set('candidateId', candidateId)
    startTransition(() => updateMatchStatus(fd))
  }

  function handleDelete(matchId: string) {
    if (!confirm('この案件との紐付けを削除しますか？')) return
    const fd = new FormData()
    fd.set('matchId', matchId)
    fd.set('candidateId', candidateId)
    startTransition(() => deleteMatch(fd))
  }

  const linkedProjectIds = new Set(entries.map((e) => e.projectId))
  const unlinkedProjects = availableProjects.filter((p) => !linkedProjectIds.has(p.id))

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="section-title mb-0 flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-blue-600" />
          応募・提案案件
        </h4>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          案件を紐付け
        </button>
      </div>

      {/* 案件追加フォーム */}
      {showAddForm && (
        <form onSubmit={handleUpsert} className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <p className="text-xs font-medium text-blue-700">案件を追加</p>
          <input type="hidden" name="candidateId" value={candidateId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select name="projectId" required className="form-select text-sm">
              <option value="">案件を選択...</option>
              {unlinkedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.clientName ? ` (${p.clientName})` : ''}
                </option>
              ))}
              {unlinkedProjects.length === 0 && (
                <option disabled>紐付けできる案件がありません</option>
              )}
            </select>
            <select name="status" className="form-select text-sm" defaultValue="SUGGESTED">
              <option value="SUGGESTED">提案中</option>
              <option value="ACCEPTED">応募済み</option>
              <option value="REJECTED">NG</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary btn-sm">
              追加
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary btn-sm"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">案件が紐付けられていません</p>
      ) : (
        <div className="space-y-4">
          {/* 応募済み */}
          {accepted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                応募済み（{accepted.length}件）
              </p>
              <div className="space-y-2">
                {accepted.map((e) => (
                  <ProjectRow
                    key={e.matchId}
                    entry={e}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    pending={pending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 提案中 */}
          {suggested.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                提案中（{suggested.length}件）
              </p>
              <div className="space-y-2">
                {suggested.map((e) => (
                  <ProjectRow
                    key={e.matchId}
                    entry={e}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    pending={pending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* NG */}
          {rejected.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                NG（{rejected.length}件）
              </p>
              <div className="space-y-2">
                {rejected.map((e) => (
                  <ProjectRow
                    key={e.matchId}
                    entry={e}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    pending={pending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectRow({
  entry,
  onStatusChange,
  onDelete,
  pending,
}: {
  entry: ProjectEntry
  onStatusChange: (matchId: string, status: MatchStatus) => void
  onDelete: (matchId: string) => void
  pending: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusOptions: MatchStatus[] = ['SUGGESTED', 'ACCEPTED', 'REJECTED']

  return (
    <div
      className={`border-l-4 ${STATUS_BORDER[entry.matchStatus]} bg-white border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-2`}
    >
      {/* 左: 案件情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Link
            href={`/projects/${entry.projectId}`}
            className="text-sm font-medium text-blue-700 hover:underline truncate"
          >
            {entry.projectTitle}
          </Link>
          <span
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[entry.matchStatus]}`}
          >
            {STATUS_LABELS[entry.matchStatus]}
          </span>
          {entry.interviewResult && (
            <InterviewResultBadge result={entry.interviewResult} />
          )}
        </div>
        {entry.clientName && (
          <p className="text-xs text-gray-500">{entry.clientName}</p>
        )}
        {entry.interviewDateTime && (
          <p className="text-xs text-gray-400 mt-0.5">
            面談: {formatDateTimeShort(entry.interviewDateTime)}
          </p>
        )}
      </div>

      {/* 右: ステータス変更 + 削除 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* ステータス変更ドロップダウン */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={pending}
            className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors"
            title="ステータスを変更"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px] py-1"
              onBlur={() => setMenuOpen(false)}
            >
              {statusOptions
                .filter((s) => s !== entry.matchStatus)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onStatusChange(entry.matchId, s)
                      setMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                      s === 'REJECTED' ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              <hr className="my-1" />
              <button
                type="button"
                onClick={() => {
                  onDelete(entry.matchId)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          )}
        </div>

        {/* NGボタン (提案中・応募済みのみ) */}
        {entry.matchStatus !== 'REJECTED' && (
          <button
            type="button"
            onClick={() => onStatusChange(entry.matchId, 'REJECTED')}
            disabled={pending}
            className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            title="NGにする"
          >
            NG
          </button>
        )}

        {/* NG解除ボタン */}
        {entry.matchStatus === 'REJECTED' && (
          <button
            type="button"
            onClick={() => onStatusChange(entry.matchId, 'SUGGESTED')}
            disabled={pending}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="提案中に戻す"
          >
            解除
          </button>
        )}
      </div>
    </div>
  )
}

function formatDateTimeShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
