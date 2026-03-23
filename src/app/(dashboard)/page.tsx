import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, isOverdue, getDaysOverdue } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  Briefcase,
  Calendar,
  Bell,
  AlertCircle,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { CANDIDATE_STATUS } from '@/types'
import { InterviewReminderBanner } from '@/components/calendar/InterviewReminderBanner'
import { StatsPanel, type StatsData } from '@/components/dashboard/StatsPanel'

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const overdueThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [
    candidateCount,
    projectCount,
    todayInterviews,
    upcomingInterviews,
    overdueContacts,
    pendingNextContacts,
    statusCounts,
    noProposalCandidates,
    recentCandidates,
    recentProjects,
    // 月次統計
    monthlyCandidates,
    monthlyProjects,
    monthlyInterviews,
    monthlyPassed,
    monthlyFailed,
    monthlyProposals,
    monthlyApplications,
    // 全期間統計
    allInterviews,
    allPassed,
    allFailed,
    allProposals,
    allApplications,
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.project.count(),
    prisma.interview.findMany({
      where: { interviewDateTime: { gte: todayStart, lt: todayEnd } },
      include: { candidate: true, project: true },
      orderBy: { interviewDateTime: 'asc' },
    }),
    prisma.interview.findMany({
      where: { interviewDateTime: { gte: now, lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      include: { candidate: true, project: true },
      orderBy: { interviewDateTime: 'asc' },
      take: 5,
    }),
    prisma.communication.findMany({
      where: { nextContactDate: { lt: now }, replied: false },
      include: { candidate: true },
      orderBy: { nextContactDate: 'asc' },
      take: 5,
    }),
    prisma.communication.count({
      where: { nextContactDate: { gte: now, lt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.candidate.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.candidate.findMany({
      where: { status: { in: ['REGISTERED', 'SKILLSHEET_RECV'] }, updatedAt: { lt: overdueThreshold } },
      orderBy: { updatedAt: 'asc' },
      take: 5,
    }),
    prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 }),
    // 月次
    prisma.candidate.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.project.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd } } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd }, result: 'PASSED' } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd }, result: 'FAILED' } }),
    prisma.match.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { in: ['SUGGESTED', 'ACCEPTED'] } } }),
    prisma.match.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: 'ACCEPTED' } }),
    // 全期間
    prisma.interview.count(),
    prisma.interview.count({ where: { result: 'PASSED' } }),
    prisma.interview.count({ where: { result: 'FAILED' } }),
    prisma.match.count({ where: { status: { in: ['SUGGESTED', 'ACCEPTED'] } } }),
    prisma.match.count({ where: { status: 'ACCEPTED' } }),
  ])

  const monthlyStats: StatsData = {
    candidates: monthlyCandidates,
    projects: monthlyProjects,
    interviews: monthlyInterviews,
    proposals: monthlyProposals,
    applications: monthlyApplications,
    passed: monthlyPassed,
    failed: monthlyFailed,
  }

  const allTimeStats: StatsData = {
    candidates: candidateCount,
    projects: projectCount,
    interviews: allInterviews,
    proposals: allProposals,
    applications: allApplications,
    passed: allPassed,
    failed: allFailed,
  }

  return {
    candidateCount,
    projectCount,
    todayInterviews,
    upcomingInterviews,
    overdueContacts,
    pendingNextContacts,
    statusCounts,
    noProposalCandidates,
    recentCandidates,
    recentProjects,
    monthlyStats,
    allTimeStats,
    monthStart,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const statusOrder = Object.keys(CANDIDATE_STATUS)
  const statusMap = Object.fromEntries(
    data.statusCounts.map((s) => [s.status, s._count.status])
  )

  // 今日の面談をシリアライズ可能な形式に変換
  const todayInterviewsForBanner = data.todayInterviews.map((iv) => ({
    id: iv.id,
    interviewDateTime: iv.interviewDateTime.toISOString(),
    candidateId: iv.candidateId,
    candidateName: iv.candidate.name,
    projectTitle: iv.project?.title ?? null,
    interviewer: iv.interviewer ?? null,
  }))

  return (
    <DashboardShell title="ダッシュボード">
      {/* 当日リマインドバナー */}
      <div className="mb-4">
        <InterviewReminderBanner todayInterviews={todayInterviewsForBanner} />
      </div>

      {/* 月次/全期間 切り替え統計 */}
      <StatsPanel
        initialMonthly={data.monthlyStats}
        allTime={data.allTimeStats}
        initialYear={data.monthStart.getFullYear()}
        initialMonth={data.monthStart.getMonth() + 1}
      />

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="🦕 求職者総数"
          value={data.candidateCount}
          icon={<span className="text-2xl">🦕</span>}
          color="green"
          href="/candidates"
        />
        <StatCard
          title="🦖 案件総数"
          value={data.projectCount}
          icon={<span className="text-2xl">🦖</span>}
          color="emerald"
          href="/projects"
        />
        <StatCard
          title="🦴 本日の面談"
          value={data.todayInterviews.length}
          icon={<span className="text-2xl">🦴</span>}
          color="green"
          href="/interviews"
        />
        <StatCard
          title="📢 要連絡（3日以内）"
          value={data.pendingNextContacts}
          icon={<span className="text-2xl">📢</span>}
          color="yellow"
          href="/communications"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">
          {/* ステータス別件数 */}
          <div className="card p-4">
            <h3 className="section-title flex items-center gap-2">
              <span>🦕</span>
              求職者ステータス別件数
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statusOrder.map((status) => {
                const count = statusMap[status] ?? 0
                if (count === 0) return null
                return (
                  <Link
                    key={status}
                    href={`/candidates?status=${status}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors"
                  >
                    <CandidateStatusBadge status={status} />
                    <span className="text-lg font-bold text-gray-900 ml-2">{count}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 近日面談予定 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title flex items-center gap-2 mb-0">
                <span>🦴</span>
                近日面談予定（7日以内）
              </h3>
              <Link href="/interviews" className="text-xs text-green-700 hover:underline flex items-center gap-1">
                全て見る <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">🦕 近日の面談予定はありません</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/candidates/${interview.candidateId}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {interview.candidate.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {interview.project?.title ?? '案件未設定'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-700">
                        {formatDateTime(interview.interviewDateTime)}
                      </p>
                      {interview.interviewer && (
                        <p className="text-xs text-gray-400">{interview.interviewer}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 最近更新した求職者 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title flex items-center gap-2 mb-0">
                <span>🦕</span>
                最近更新した求職者
              </h3>
              <Link href="/candidates" className="text-xs text-green-700 hover:underline flex items-center gap-1">
                全て見る <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {data.recentCandidates.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg">
                      🦕
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.address ?? '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CandidateStatusBadge status={c.status} />
                    <p className="text-xs text-gray-400 mt-1">{formatDate(c.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 右カラム: アラート */}
        <div className="space-y-6">
          {/* 連絡漏れ */}
          <div className="card p-4 border-l-4 border-l-red-400">
            <h3 className="section-title flex items-center gap-2 text-red-700">
              <span>🦖</span>
              連絡漏れ候補
            </h3>
            {data.overdueContacts.length === 0 ? (
              <p className="text-sm text-gray-400">🦕 連絡漏れなし！快調です</p>
            ) : (
              <div className="space-y-2">
                {data.overdueContacts.map((comm) => (
                  <Link
                    key={comm.id}
                    href={`/candidates/${comm.candidateId}`}
                    className="block p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{comm.candidate.name}</p>
                    <p className="text-xs text-red-600">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getDaysOverdue(comm.nextContactDate)}日超過
                    </p>
                    {comm.memo && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{comm.memo}</p>
                    )}
                  </Link>
                ))}
                <Link
                  href="/progress"
                  className="block text-xs text-red-600 hover:underline mt-2 flex items-center gap-1"
                >
                  全て確認 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* 提案漏れ */}
          <div className="card p-4 border-l-4 border-l-orange-400">
            <h3 className="section-title flex items-center gap-2 text-orange-700">
              <span>🦖</span>
              提案漏れ候補
            </h3>
            {data.noProposalCandidates.length === 0 ? (
              <p className="text-sm text-gray-400">🦕 提案漏れなし！絶好調です</p>
            ) : (
              <div className="space-y-2">
                {data.noProposalCandidates.map((c) => (
                  <Link
                    key={c.id}
                    href={`/candidates/${c.id}`}
                    className="block p-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CandidateStatusBadge status={c.status} />
                      <span className="text-xs text-orange-600">
                        {getDaysOverdue(c.updatedAt)}日更新なし
                      </span>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/progress"
                  className="block text-xs text-orange-600 hover:underline mt-2 flex items-center gap-1"
                >
                  全て確認 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* 最近更新した案件 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title flex items-center gap-2 mb-0">
                <span>🦖</span>
                最近の案件
              </h3>
              <Link href="/projects" className="text-xs text-green-700 hover:underline">
                全て
              </Link>
            </div>
            <div className="space-y-2">
              {data.recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 truncate">{p.clientName ?? '-'}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'indigo' | 'green' | 'emerald' | 'yellow'
  href: string
}) {
  const colors = {
    blue: 'bg-green-50 text-green-700',
    indigo: 'bg-emerald-50 text-emerald-700',
    green: 'bg-green-50 text-green-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-yellow-50 text-yellow-600',
  }
  return (
    <Link href={href} className="card p-4 hover:shadow-md transition-shadow block">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </Link>
  )
}
