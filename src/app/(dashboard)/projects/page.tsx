import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProjectStatusBadge, WorkStyleBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatRate } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, Plus, Search, FolderX } from 'lucide-react'
import { PROJECT_STATUS } from '@/types'

interface SearchParams {
  q?: string
  status?: string
  sort?: string
}

async function getProjects(params: SearchParams) {
  const where: Record<string, unknown> = {}

  if (params.q) {
    const words = params.q.trim().split(/\s+/).filter(Boolean)
    where.AND = words.map((word) => ({
      OR: [
        { title: { contains: word } },
        { clientName: { contains: word } },
        { sourceClientName: { contains: word } },
        { requiredSkills: { contains: word } },
        { description: { contains: word } },
        { workConditions: { contains: word } },
      ],
    }))
  }

  if (params.status) {
    where.status = params.status
  }

  const orderBy: Record<string, string> = {}
  switch (params.sort) {
    case 'title': orderBy.title = 'asc'; break
    case 'status': orderBy.status = 'asc'; break
    case 'rate': orderBy.desiredRate = 'desc'; break
    default: orderBy.updatedAt = 'desc'
  }

  return prisma.project.findMany({
    where,
    include: { _count: { select: { interviews: true, matches: true, receivedProjects: true } } },
    orderBy,
  })
}

type Project = Awaited<ReturnType<typeof getProjects>>[number]

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <>
      {/* テーブル (デスクトップ) */}
      <div className="card hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">案件名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">クライアント</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">必須スキル</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">勤務形態</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">稼働時間</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">希望単価</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">面談数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">最終更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-400">
                    該当する案件がありません
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/projects/${p.id}`} className="font-medium text-blue-700 hover:underline">
                          {p.title}
                        </Link>
                        {p._count.receivedProjects >= 2 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" />
                            同一案件あり
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.clientName ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{p.requiredSkills ?? '-'}</td>
                    <td className="px-4 py-3"><WorkStyleBadge style={p.workStyle} /></td>
                    <td className="px-4 py-3 text-gray-600">{p.workHours ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRate(p.desiredRate)}</td>
                    <td className="px-4 py-3"><ProjectStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-600 text-center">{p._count.interviews}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* カードリスト (モバイル) */}
      <div className="md:hidden space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">該当する案件がありません</p>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                    {p._count.receivedProjects >= 2 && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" />
                        同一案件あり
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{p.clientName ?? '-'}</p>
                </div>
                <ProjectStatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <WorkStyleBadge style={p.workStyle} />
                <span className="text-sm text-gray-600">{p.workHours}</span>
                <span className="text-sm text-gray-600">{formatRate(p.desiredRate)}</span>
              </div>
              {p.requiredSkills && (
                <p className="text-xs text-gray-500 mt-1 truncate">{p.requiredSkills}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </>
  )
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const projects = await getProjects(searchParams)

  const active = projects.filter((p) => p.status !== 'CLOSED')
  const closed = projects.filter((p) => p.status === 'CLOSED')

  return (
    <DashboardShell title="案件管理">
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
                placeholder="案件名・クライアント・スキルで検索..."
                className="form-input pl-9"
              />
            </div>
            <select name="status" defaultValue={searchParams.status ?? ''} className="form-select w-auto">
              <option value="">全ステータス</option>
              {Object.entries(PROJECT_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary">絞込</button>
          </form>
          <Link href="/projects/new" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            新規登録
          </Link>
        </div>

        <p className="text-sm text-gray-500">{projects.length}件</p>

        {/* アクティブ案件 */}
        {active.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600">
              アクティブ案件（{active.length}件）
            </h3>
            <ProjectTable projects={active} />
          </div>
        )}

        {active.length === 0 && closed.length === 0 && (
          <div className="card p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">🦖</p>
            <p>案件が見つかりません</p>
          </div>
        )}

        {/* 終了案件フォルダ */}
        <details open={closed.length > 0 && active.length === 0} className="group">
          <summary className="flex items-center gap-2 cursor-pointer select-none list-none py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
            <FolderX className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-600">終了案件フォルダ</span>
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {closed.length}件
            </span>
            <span className="ml-auto text-gray-400 text-xs group-open:hidden">▶ 開く</span>
            <span className="ml-auto text-gray-400 text-xs hidden group-open:inline">▼ 閉じる</span>
          </summary>
          <div className="mt-2 space-y-3">
            <ProjectTable projects={closed} />
          </div>
        </details>
      </div>
    </DashboardShell>
  )
}
