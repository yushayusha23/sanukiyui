import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, getDaysOverdue, isOverdue } from '@/lib/utils'
import Link from 'next/link'
import { AlertCircle, Clock, UserX, Calendar, TrendingUp } from 'lucide-react'
import { CANDIDATE_STATUS } from '@/types'

async function getProgressData() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    statusCounts,
    overdueContacts,
    waitingReplyOverdue,
    noProposalRegistered,
    noProposalSkillsheet,
    stuckIntroducing,
    upcomingInterviews,
    noUpdateCandidates,
  ] = await Promise.all([
    // ステータス別件数
    prisma.candidate.groupBy({
      by: ['status'],
      _count: { status: true },
    }),

    // 次回連絡予定日超過
    prisma.communication.findMany({
      where: {
        nextContactDate: { lt: now },
        replied: false,
      },
      include: { candidate: true },
      orderBy: { nextContactDate: 'asc' },
    }),

    // 返信待ちで7日以上経過
    prisma.communication.findMany({
      where: {
        replied: false,
        nextContactDate: null,
        contactedAt: { lt: sevenDaysAgo },
      },
      include: { candidate: true },
      orderBy: { contactedAt: 'asc' },
      take: 10,
    }),

    // 登録済みで提案なし（7日以上）
    prisma.candidate.findMany({
      where: {
        status: 'REGISTERED',
        updatedAt: { lt: sevenDaysAgo },
      },
      orderBy: { updatedAt: 'asc' },
    }),

    // スキルシート受領済みで提案なし（7日以上）
    prisma.candidate.findMany({
      where: {
        status: 'SKILLSHEET_RECV',
        updatedAt: { lt: sevenDaysAgo },
      },
      orderBy: { updatedAt: 'asc' },
    }),

    // 案件紹介中で14日以上止まっている
    prisma.candidate.findMany({
      where: {
        status: 'INTRODUCING',
        updatedAt: { lt: fourteenDaysAgo },
      },
      orderBy: { updatedAt: 'asc' },
    }),

    // 直近7日以内の面談
    prisma.interview.findMany({
      where: {
        interviewDateTime: { gte: now, lt: sevenDaysLater },
      },
      include: {
        candidate: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { interviewDateTime: 'asc' },
    }),

    // 30日以上更新なし（全ステータス）
    prisma.candidate.findMany({
      where: {
        status: {
          notIn: ['PASSED', 'FAILED', 'ON_HOLD'],
        },
        updatedAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    }),
  ])

  return {
    statusCounts,
    overdueContacts,
    waitingReplyOverdue,
    noProposalRegistered,
    noProposalSkillsheet,
    stuckIntroducing,
    upcomingInterviews,
    noUpdateCandidates,
  }
}

export default async function ProgressPage() {
  const data = await getProgressData()

  const totalCandidates = data.statusCounts.reduce((sum, s) => sum + s._count.status, 0)
  const statusOrder = Object.keys(CANDIDATE_STATUS)

  const allOverdueCommunications = [
    ...data.overdueContacts,
    ...data.waitingReplyOverdue.filter(
      (w) => !data.overdueContacts.find((o) => o.candidateId === w.candidateId)
    ),
  ]

  const allNoProposal = [
    ...data.noProposalRegistered,
    ...data.noProposalSkillsheet,
    ...data.stuckIntroducing,
  ]

  return (
    <DashboardShell title="進捗管理">
      <div className="space-y-6">
        {/* ステータス別件数 */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            ステータス別件数（全求職者 {totalCandidates}名）
          </h3>
          <div className="space-y-2">
            {statusOrder.map((status) => {
              const count = data.statusCounts.find((s) => s.status === status)?._count.status ?? 0
              const pct = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0
              return (
                <Link
                  key={status}
                  href={`/candidates?status=${status}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-36 flex-shrink-0">
                    <CandidateStatusBadge status={status} />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{count}名</span>
                  <span className="text-xs text-gray-400 w-10">{pct}%</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 連絡漏れ候補 */}
          <div className="card p-5">
            <h3 className="section-title flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              連絡漏れ候補（{allOverdueCommunications.length}件）
            </h3>
            {allOverdueCommunications.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <p className="text-2xl mb-1">✓</p>
                <p className="text-sm font-medium">連絡漏れはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allOverdueCommunications.slice(0, 10).map((comm) => (
                  <Link
                    key={comm.id}
                    href={`/candidates/${comm.candidateId}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{comm.candidate.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{comm.memo}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {comm.nextContactDate ? (
                        <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getDaysOverdue(comm.nextContactDate)}日超過
                        </p>
                      ) : (
                        <p className="text-xs text-orange-600">返信待ち長期</p>
                      )}
                    </div>
                  </Link>
                ))}
                {allOverdueCommunications.length > 10 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    他 {allOverdueCommunications.length - 10}件
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 提案漏れ候補 */}
          <div className="card p-5">
            <h3 className="section-title flex items-center gap-2 text-orange-700">
              <UserX className="w-4 h-4" />
              提案漏れ候補（{allNoProposal.length}件）
            </h3>
            {allNoProposal.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <p className="text-2xl mb-1">✓</p>
                <p className="text-sm font-medium">提案漏れはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allNoProposal.slice(0, 10).map((c) => (
                  <Link
                    key={c.id}
                    href={`/candidates/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-orange-100 hover:bg-orange-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <CandidateStatusBadge status={c.status} />
                    </div>
                    <p className="text-xs font-medium text-orange-600 flex-shrink-0 ml-2">
                      {getDaysOverdue(c.updatedAt)}日更新なし
                    </p>
                  </Link>
                ))}
                {allNoProposal.length > 10 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    他 {allNoProposal.length - 10}件
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 近日面談予定 */}
          <div className="card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              近日面談予定（7日以内 {data.upcomingInterviews.length}件）
            </h3>
            {data.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">近日の面談予定はありません</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingInterviews.map((iv) => (
                  <Link
                    key={iv.id}
                    href={`/candidates/${iv.candidate.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{iv.candidate.name}</p>
                      {iv.project && (
                        <p className="text-xs text-gray-500">{iv.project.title}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-blue-600 flex-shrink-0">
                      {formatDate(iv.interviewDateTime)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 30日以上更新なし */}
          <div className="card p-5">
            <h3 className="section-title flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              30日以上更新なし（{data.noUpdateCandidates.length}件）
            </h3>
            {data.noUpdateCandidates.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">更新なし候補はいません</p>
            ) : (
              <div className="space-y-2">
                {data.noUpdateCandidates.map((c) => (
                  <Link
                    key={c.id}
                    href={`/candidates/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{c.name}</p>
                      <CandidateStatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      {getDaysOverdue(c.updatedAt)}日前
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
