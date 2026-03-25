import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateStatusBadge, WorkStyleBadge, ActionStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, formatRate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search, Trophy, PauseCircle, XCircle } from 'lucide-react'
import { CANDIDATE_STATUS } from '@/types'

interface SearchParams {
  q?: string
  status?: string
  sort?: string
}

const ACTIVE_STATUSES = [
  'APPLIED', 'REGISTERED', 'SKILLSHEET_RECV', 'INTRODUCING',
  'INTERVIEW_DATE_COLLECTING', 'INTERVIEW_DATE_CONFIRMED', 'INTERVIEWED',
]

async function getCandidates(params: SearchParams) {
  const where: Record<string, unknown> = {}

  if (params.q) {
    const words = params.q.trim().split(/\s+/).filter(Boolean)
    where.AND = words.map((word) => ({
      OR: [
        { name: { contains: word } },
        { address: { contains: word } },
        { notes: { contains: word } },
        { skillDetails: { freeSkillNote: { contains: word } } },
        { skillDetails: { tools: { contains: word } } },
        { skillDetails: { strengths: { contains: word } } },
        { skillDetails: { otherBpoExperience: { contains: word } } },
      ],
    }))
  }

  if (params.status) {
    where.status = params.status
  }

  const orderBy: Record<string, string> = {}
  switch (params.sort) {
    case 'name': orderBy.name = 'asc'; break
    case 'status': orderBy.status = 'asc'; break
    case 'interview': orderBy.confirmedInterviewDate = 'asc'; break
    case 'available': orderBy.availableStartDate = 'asc'; break
    default: orderBy.updatedAt = 'desc'
  }

  return prisma.candidate.findMany({
    where,
    include: {
      skillDetails: true,
      client: { select: { name: true, codeName: true } },
      documents: { select: { id: true, fileName: true, filePath: true }, take: 1 },
    },
    orderBy,
  })
}

type Candidate = Awaited<ReturnType<typeof getCandidates>>[number]

function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <>
      {/* テーブル (デスクトップ) */}
      <div className="card hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">氏名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">所属会社</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">年齢</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">居住地</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">希望勤務形態</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">稼働時間</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">希望単価</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">アクション</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">面談確定日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">稼働開始日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">最終更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-6 text-center text-gray-400">
                    該当する人材がいません
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/candidates/${c.id}`} className="font-medium text-blue-700 hover:underline">
                        {c.name}
                      </Link>
                      {c.documents[0] && (
                        <a href={c.documents[0].filePath} target="_blank" rel="noopener noreferrer"
                          className="ml-1.5 text-xs text-green-600 hover:underline inline-flex items-center gap-0.5"
                          title={c.documents[0].fileName}>
                          📎
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.client?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.age ? `${c.age}歳` : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.address ?? '-'}</td>
                    <td className="px-4 py-3"><WorkStyleBadge style={c.preferredWorkStyle} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.preferredWorkHours
                        ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.preferredWorkHours}</span>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatRate(c.desiredHourlyRate)}</td>
                    <td className="px-4 py-3"><CandidateStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><ActionStatusBadge status={c.actionStatus} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.confirmedInterviewDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.availableStartDate)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* カードリスト (モバイル) */}
      <div className="md:hidden space-y-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">該当する人材がいません</p>
        ) : (
          candidates.map((c) => (
            <Link key={c.id} href={`/candidates/${c.id}`} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.documents[0] && (
                      <a href={c.documents[0].filePath} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-600 text-sm" title={c.documents[0].fileName}>📎</a>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{c.client?.name ?? ''}{c.age ? `　${c.age}歳` : ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CandidateStatusBadge status={c.status} />
                  <ActionStatusBadge status={c.actionStatus} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600">
                <WorkStyleBadge style={c.preferredWorkStyle} />
                {c.preferredWorkHours && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.preferredWorkHours}</span>
                )}
                <span>{formatRate(c.desiredHourlyRate)}</span>
              </div>
              {c.confirmedInterviewDate && (
                <p className="text-xs text-blue-600 mt-1">
                  面談: {formatDateTime(c.confirmedInterviewDate)}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </>
  )
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const candidates = await getCandidates(searchParams)

  const active = candidates.filter((c) => ACTIVE_STATUSES.includes(c.status))
  const passed = candidates.filter((c) => c.status === 'PASSED')
  const onHold = candidates.filter((c) => c.status === 'ON_HOLD')
  const failed = candidates.filter((c) => c.status === 'FAILED')

  return (
    <DashboardShell title="人材管理">
      <div className="space-y-4">
        {/* ヘッダー操作バー */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q}
                placeholder="氏名・スキル・住所で検索..."
                className="form-input pl-9"
              />
            </div>
            <select name="status" defaultValue={searchParams.status ?? ''} className="form-select w-auto">
              <option value="">全ステータス</option>
              {Object.entries(CANDIDATE_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select name="sort" defaultValue={searchParams.sort ?? ''} className="form-select w-auto hidden sm:block">
              <option value="">最終更新順</option>
              <option value="name">氏名順</option>
              <option value="status">ステータス順</option>
              <option value="interview">面談日順</option>
              <option value="available">稼働開始日順</option>
            </select>
            <button type="submit" className="btn-secondary">絞込</button>
          </form>
          <Link href="/candidates/new" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            新規登録
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          {candidates.length}件
          {searchParams.q && ` 「${searchParams.q}」の検索結果`}
          {searchParams.status && ` / ${CANDIDATE_STATUS[searchParams.status as keyof typeof CANDIDATE_STATUS] ?? searchParams.status}`}
        </p>

        {/* アクティブ */}
        {active.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600">
              アクティブ（{active.length}件）
            </h3>
            <CandidateTable candidates={active} />
          </div>
        )}

        {active.length === 0 && passed.length === 0 && onHold.length === 0 && failed.length === 0 && (
          <div className="card p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">🦕</p>
            <p>人材が見つかりません</p>
          </div>
        )}

        {/* 合格フォルダ */}
        <details open={passed.length > 0} className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none list-none py-2 px-3 rounded-lg hover:bg-green-50 transition-colors">
            <Trophy className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">合格フォルダ</span>
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {passed.length}件
            </span>
            <span className="ml-auto text-gray-400 text-xs group-open:hidden">▶ 開く</span>
            <span className="ml-auto text-gray-400 text-xs hidden group-open:inline">▼ 閉じる</span>
          </summary>
          <div className="mt-2 space-y-3">
            <CandidateTable candidates={passed} />
          </div>
        </details>

        {/* 保留フォルダ */}
        <details open={onHold.length > 0} className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none list-none py-2 px-3 rounded-lg hover:bg-yellow-50 transition-colors">
            <PauseCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">保留フォルダ</span>
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              {onHold.length}件
            </span>
            <span className="ml-auto text-gray-400 text-xs group-open:hidden">▶ 開く</span>
            <span className="ml-auto text-gray-400 text-xs hidden group-open:inline">▼ 閉じる</span>
          </summary>
          <div className="mt-2 space-y-3">
            <CandidateTable candidates={onHold} />
          </div>
        </details>

        {/* 辞退フォルダ */}
        <details open={failed.length > 0} className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none list-none py-2 px-3 rounded-lg hover:bg-red-50 transition-colors">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">辞退フォルダ</span>
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {failed.length}件
            </span>
            <span className="ml-auto text-gray-400 text-xs group-open:hidden">▶ 開く</span>
            <span className="ml-auto text-gray-400 text-xs hidden group-open:inline">▼ 閉じる</span>
          </summary>
          <div className="mt-2 space-y-3">
            <CandidateTable candidates={failed} />
          </div>
        </details>
      </div>
    </DashboardShell>
  )
}
