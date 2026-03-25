'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check, ExternalLink, Folder, FolderX } from 'lucide-react'
import { ProjectStatusBadge, WorkStyleBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatRateNew } from '@/lib/utils'

type ReceivedProject = {
  id: string
  sourceName: string
  title: string | null
  description: string | null
  memo: string | null
  receivedAt: Date | string
}

type Project = {
  id: string
  title: string
  clientName: string | null
  sourceClientName: string | null
  description: string | null
  requiredSkills: string | null
  workStyle: string | null
  workHours: string | null
  rateType: string | null
  rateMin: number | null
  rateMax: number | null
  desiredRate: number | null
  minimumRate: number | null
  workConditions: string | null
  recruitmentStatus: string | null
  isYearsRequired: number | null
  fsYearsRequired: number | null
  saasYearsRequired: number | null
  status: string
  updatedAt: Date | string
  _count: { interviews: number; matches: number }
  receivedProjects: ReceivedProject[]
}

function useCopy() {
  const [copied, setCopied] = useState(false)
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return { copied, copy }
}

function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      onClick={() => copy(text)}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? 'コピー済' : label}
    </button>
  )
}

function buildProjectText(p: Project) {
  const lines = [
    `【案件名】${p.title}`,
    p.workStyle ? `【勤務形態】${p.workStyle}` : null,
    p.workHours ? `【稼働時間】${p.workHours}` : null,
    (p.rateMin || p.desiredRate) ? `【単価】${formatRateNew(p.rateType, p.rateMin ?? p.desiredRate, p.rateMax)}` : null,
    p.requiredSkills ? `【必須スキル】\n${p.requiredSkills}` : null,
    p.description ? `【詳細】\n${p.description}` : null,
    p.workConditions ? `【勤務条件】\n${p.workConditions}` : null,
    (p.isYearsRequired || p.fsYearsRequired || p.saasYearsRequired) ? `【経験要件】${[
      p.isYearsRequired ? `IS ${p.isYearsRequired}年以上` : null,
      p.fsYearsRequired ? `FS ${p.fsYearsRequired}年以上` : null,
      p.saasYearsRequired ? `SaaS ${p.saasYearsRequired}年以上` : null,
    ].filter(Boolean).join(' / ')}` : null,
  ]
  return lines.filter(Boolean).join('\n')
}

function buildReceivedText(r: ReceivedProject) {
  const lines = [
    `【送り元】${r.sourceName}`,
    r.title ? `【タイトル】${r.title}` : null,
    r.description ? `【内容】\n${r.description}` : null,
    r.memo ? `【メモ】${r.memo}` : null,
  ]
  return lines.filter(Boolean).join('\n')
}

function ProjectRow({ p }: { p: Project }) {
  const [open, setOpen] = useState(false)
  const [receivedOpen, setReceivedOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 行 */}
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-gray-400 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{p.title}</span>
            {p.receivedProjects.length >= 2 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap">
                <AlertTriangle className="w-3 h-3" />
                同一案件あり
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{p.clientName ?? '-'}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <WorkStyleBadge style={p.workStyle} />
          {p.workHours && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">{p.workHours}</span>}
          <span className="text-xs text-gray-500">{formatRateNew(p.rateType, p.rateMin ?? p.desiredRate, p.rateMax)}</span>
          <ProjectStatusBadge status={p.status} />
        </div>
        <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
          {p.workHours && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">{p.workHours}</span>}
          <ProjectStatusBadge status={p.status} />
        </div>
      </div>

      {/* 展開：詳細 */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
          {/* ヘッダー操作 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <WorkStyleBadge style={p.workStyle} />
              {p.workHours && <span className="text-xs text-gray-600">{p.workHours}</span>}
              {(p.rateMin || p.desiredRate) && <span className="text-xs text-gray-600">{formatRateNew(p.rateType, p.rateMin ?? p.desiredRate, p.rateMax)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={buildProjectText(p)} label="案件情報コピー" />
              <Link
                href={`/projects/${p.id}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-600 text-green-700 hover:bg-green-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                詳細ページ
              </Link>
            </div>
          </div>

          {/* スキル・詳細 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {p.requiredSkills && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">必須スキル</p>
                <p className="text-gray-700 whitespace-pre-wrap">{p.requiredSkills}</p>
              </div>
            )}
            {(p.isYearsRequired || p.fsYearsRequired || p.saasYearsRequired) && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">経験要件</p>
                <div className="flex flex-wrap gap-2">
                  {p.isYearsRequired && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">IS {p.isYearsRequired}年以上</span>}
                  {p.fsYearsRequired && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">FS {p.fsYearsRequired}年以上</span>}
                  {p.saasYearsRequired && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">SaaS {p.saasYearsRequired}年以上</span>}
                </div>
              </div>
            )}
            {p.description && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">案件詳細</p>
                <p className="text-gray-700 whitespace-pre-wrap">{p.description}</p>
              </div>
            )}
            {p.workConditions && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">勤務条件</p>
                <p className="text-gray-700 whitespace-pre-wrap">{p.workConditions}</p>
              </div>
            )}
          </div>

          {/* 元案件記載箇所 */}
          {p.receivedProjects.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <button
                onClick={() => setReceivedOpen(o => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
              >
                {receivedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Folder className="w-4 h-4 text-amber-500" />
                元案件記載箇所（{p.receivedProjects.length}件）
              </button>
              {receivedOpen && (
                <div className="mt-3 space-y-3">
                  {p.receivedProjects.map(r => (
                    <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-700">{r.sourceName}</span>
                        <CopyButton text={buildReceivedText(r)} label="コピー" />
                      </div>
                      {r.title && <p className="text-xs font-medium text-gray-700 mb-1">{r.title}</p>}
                      {r.description && (
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{r.description}</p>
                      )}
                      {r.memo && (
                        <p className="text-xs text-amber-700 mt-2 italic">📝 {r.memo}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectListClient({ projects }: { projects: Project[] }) {
  const active = projects.filter(p => p.status !== 'CLOSED')
  const closed = projects.filter(p => p.status === 'CLOSED')
  const [closedOpen, setClosedOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* アクティブ案件 */}
      {active.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">アクティブ案件（{active.length}件）</h3>
          {active.map(p => <ProjectRow key={p.id} p={p} />)}
        </div>
      )}

      {projects.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-4xl mb-2">🦖</p>
          <p>案件が見つかりません</p>
        </div>
      )}

      {/* 終了案件フォルダ */}
      {closed.length > 0 && (
        <div>
          <button
            onClick={() => setClosedOpen(o => !o)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
          >
            <FolderX className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-600">終了案件フォルダ</span>
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{closed.length}件</span>
            <span className="ml-auto text-gray-400 text-xs">{closedOpen ? '▼ 閉じる' : '▶ 開く'}</span>
          </button>
          {closedOpen && (
            <div className="mt-2 space-y-2">
              {closed.map(p => <ProjectRow key={p.id} p={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
