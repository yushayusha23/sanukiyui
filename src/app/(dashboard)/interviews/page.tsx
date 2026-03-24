import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { InterviewResultBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getInterviews() {
  return prisma.interview.findMany({
    include: {
      candidate: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { interviewDateTime: 'desc' },
  })
}

export default async function InterviewsPage() {
  const interviews = await getInterviews()

  const now = new Date()
  const upcoming = interviews.filter((i) => new Date(i.interviewDateTime) >= now)
  const past = interviews.filter((i) => new Date(i.interviewDateTime) < now)

  return (
    <DashboardShell title="面談管理">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/interviews/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            面談を追加
          </Link>
        </div>

        {/* 予定面談 */}
        <div>
          <h3 className="section-title">予定している面談（{upcoming.length}件）</h3>
          <InterviewTable interviews={upcoming} emptyText="予定している面談はありません" />
        </div>

        {/* 過去の面談 */}
        <div>
          <h3 className="section-title">過去の面談（{past.length}件）</h3>
          <InterviewTable interviews={past} emptyText="過去の面談記録はありません" />
        </div>
      </div>
    </DashboardShell>
  )
}

type Interview = {
  id: string
  interviewDateTime: Date
  interviewer: string | null
  result: string | null
  memo: string | null
  candidate: { id: string; name: string }
  project: { id: string; title: string } | null
}

function InterviewTable({ interviews, emptyText }: { interviews: Interview[]; emptyText: string }) {
  if (interviews.length === 0) {
    return <p className="text-sm text-gray-400 py-4">{emptyText}</p>
  }

  return (
    <div className="card overflow-hidden">
      {/* デスクトップテーブル */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">面談日時</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">人材</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">案件</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">担当者</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">結果</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">メモ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {interviews.map((iv) => (
              <tr key={iv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-blue-700">
                  {formatDateTime(iv.interviewDateTime)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/candidates/${iv.candidate.id}`} className="text-blue-700 hover:underline">
                    {iv.candidate.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {iv.project ? (
                    <Link href={`/projects/${iv.project.id}`} className="hover:underline text-gray-700">
                      {iv.project.title}
                    </Link>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-gray-600">{iv.interviewer ?? '-'}</td>
                <td className="px-4 py-3"><InterviewResultBadge result={iv.result} /></td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{iv.memo ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイルカード */}
      <div className="sm:hidden divide-y divide-gray-100">
        {interviews.map((iv) => (
          <div key={iv.id} className="p-4">
            <div className="flex items-start justify-between mb-1">
              <Link href={`/candidates/${iv.candidate.id}`} className="font-medium text-blue-700">
                {iv.candidate.name}
              </Link>
              <InterviewResultBadge result={iv.result} />
            </div>
            <p className="text-sm text-blue-600">{formatDateTime(iv.interviewDateTime)}</p>
            {iv.project && (
              <p className="text-xs text-gray-500 mt-0.5">{iv.project.title}</p>
            )}
            {iv.memo && <p className="text-xs text-gray-600 mt-1">{iv.memo}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
