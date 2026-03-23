import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateStatusBadge, ProjectStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, Pencil, Users, Briefcase } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  TALENT: '人材元', PROJECT: '案件元', BOTH: '両方',
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      candidates: { orderBy: { createdAt: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!client) notFound()

  return (
    <DashboardShell title={client.name}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="btn-secondary btn-sm">← 一覧へ</Link>
          <Link href={`/clients/${client.id}/edit`} className="btn-primary btn-sm">
            <Pencil className="w-3.5 h-3.5" />編集
          </Link>
        </div>

        {/* クライアント情報 */}
        <div className={`card p-5 ${client.caution ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
            {client.codeName && (
              <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                {client.codeName}
              </span>
            )}
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {TYPE_LABEL[client.type] ?? '両方'}
            </span>
            {client.caution && (
              <span className="flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />要注意
              </span>
            )}
          </div>
          {client.cautionNote && (
            <p className="text-sm text-red-600 mb-2">⚠️ {client.cautionNote}</p>
          )}
          {client.memo && (
            <p className="text-sm text-gray-600">{client.memo}</p>
          )}
        </div>

        {/* 紐づき人材 */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            紐づき人材（{client.candidates.length}名）
          </h3>
          {client.candidates.length === 0 ? (
            <p className="text-sm text-gray-400">紐づいている人材はいません</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {client.candidates.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <Link href={`/candidates/${c.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                    {c.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <CandidateStatusBadge status={c.status} />
                    <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 紐づき案件 */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4" />
            紐づき案件（{client.projects.length}件）
          </h3>
          {client.projects.length === 0 ? (
            <p className="text-sm text-gray-400">紐づいている案件はありません</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {client.projects.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <Link href={`/projects/${p.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <ProjectStatusBadge status={p.status} />
                    <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
