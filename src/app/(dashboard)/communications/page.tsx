import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ContactTypeBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, isOverdue } from '@/lib/utils'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { CommunicationForm } from '@/components/communications/CommunicationForm'
import { createCommunication } from '@/lib/actions/communications'

interface SearchParams {
  candidateId?: string
  redirectTo?: string
  filter?: string
}

async function getCommunications(candidateId?: string, filter?: string) {
  const where: Record<string, unknown> = {}

  if (candidateId) {
    where.candidateId = candidateId
  }

  if (filter === 'overdue') {
    where.nextContactDate = { lt: new Date() }
    where.replied = false
  } else if (filter === 'pending') {
    where.replied = false
  }

  return prisma.communication.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true } },
    },
    orderBy: { contactedAt: 'desc' },
    take: 100,
  })
}

async function getCandidates() {
  return prisma.candidate.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [communications, candidates] = await Promise.all([
    getCommunications(searchParams.candidateId, searchParams.filter),
    getCandidates(),
  ])

  const overdueCount = communications.filter(
    (c) => !c.replied && c.nextContactDate && isOverdue(c.nextContactDate)
  ).length

  return (
    <DashboardShell title="連絡履歴">
      <div className="space-y-6">
        {/* 連絡追加フォーム */}
        <div className="card p-5">
          <h3 className="section-title">連絡を記録する</h3>
          <CommunicationForm
            action={createCommunication}
            candidates={candidates}
            defaultCandidateId={searchParams.candidateId}
            redirectTo={searchParams.redirectTo ?? '/communications'}
          />
        </div>

        {/* フィルター */}
        <div className="flex items-center gap-3">
          <Link
            href="/communications"
            className={`btn-sm ${!searchParams.filter ? 'btn-primary' : 'btn-secondary'}`}
          >
            全て
          </Link>
          <Link
            href="/communications?filter=overdue"
            className={`btn-sm flex items-center gap-1 ${searchParams.filter === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {overdueCount > 0 && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            期限超過
          </Link>
          <Link
            href="/communications?filter=pending"
            className={`btn-sm ${searchParams.filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          >
            返信待ち
          </Link>
        </div>

        {/* 連絡一覧 */}
        <div>
          <p className="text-sm text-gray-500 mb-3">{communications.length}件</p>

          {/* テーブル (デスクトップ) */}
          <div className="card hidden sm:block overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">求職者</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">手段</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">連絡日時</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">内容</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">返信</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">次回連絡予定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {communications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      連絡履歴がありません
                    </td>
                  </tr>
                ) : (
                  communications.map((comm) => {
                    const overdue = !comm.replied && comm.nextContactDate && isOverdue(comm.nextContactDate)
                    return (
                      <tr key={comm.id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <Link href={`/candidates/${comm.candidateId}`} className="font-medium text-blue-700 hover:underline">
                            {comm.candidate.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><ContactTypeBadge type={comm.type} /></td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(comm.contactedAt)}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{comm.memo ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${comm.replied ? 'text-green-600' : 'text-orange-600'}`}>
                            {comm.replied ? '返信あり' : '返信待ち'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {comm.nextContactDate ? (
                            <span className={`text-sm flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                              {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                              {formatDate(comm.nextContactDate)}
                              {overdue && ' 超過'}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* モバイルカード */}
          <div className="sm:hidden space-y-3">
            {communications.map((comm) => {
              const overdue = !comm.replied && comm.nextContactDate && isOverdue(comm.nextContactDate)
              return (
                <div key={comm.id} className={`card p-4 ${overdue ? 'border-red-200 bg-red-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/candidates/${comm.candidateId}`} className="font-medium text-blue-700">
                      {comm.candidate.name}
                    </Link>
                    <ContactTypeBadge type={comm.type} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{formatDateTime(comm.contactedAt)}</p>
                  {comm.memo && <p className="text-sm text-gray-700 mb-1">{comm.memo}</p>}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={comm.replied ? 'text-green-600' : 'text-orange-600'}>
                      {comm.replied ? '返信あり' : '返信待ち'}
                    </span>
                    {comm.nextContactDate && (
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        次回: {formatDate(comm.nextContactDate)}
                        {overdue && ' (超過)'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
