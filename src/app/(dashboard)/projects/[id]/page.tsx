import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProjectStatusBadge, WorkStyleBadge, InterviewResultBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, formatRate } from '@/lib/utils'
import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'
import { matchProjectToCandidates } from '@/lib/matching'
import { deleteProject } from '@/lib/actions/projects'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { ReceivedProjectsSection } from '@/components/projects/ReceivedProjectsSection'

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      interviews: {
        include: { candidate: true },
        orderBy: { interviewDateTime: 'desc' },
      },
      receivedProjects: {
        orderBy: { receivedAt: 'desc' },
      },
    },
  })
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  if (!project) notFound()

  // マッチング: この案件に合いそうな候補者
  const allCandidates = await prisma.candidate.findMany({
    where: {
      status: {
        in: ['REGISTERED', 'SKILLSHEET_RECV', 'INTRODUCING', 'INTERVIEW_DATE_COLLECTING'],
      },
    },
    include: { skillDetails: true },
  })

  const matchResults = matchProjectToCandidates(
    {
      id: project.id,
      title: project.title,
      workStyle: project.workStyle,
      workHours: project.workHours,
      desiredRate: project.desiredRate,
      minimumRate: project.minimumRate,
      requiredSkills: project.requiredSkills,
      isYearsRequired: project.isYearsRequired ?? null,
      fsYearsRequired: project.fsYearsRequired ?? null,
      saasYearsRequired: project.saasYearsRequired ?? null,
    },
    allCandidates.map((c) => ({
      id: c.id,
      name: c.name,
      preferredWorkStyle: c.preferredWorkStyle,
      desiredHourlyRate: c.desiredHourlyRate,
      minimumHourlyRate: c.minimumHourlyRate,
      skillDetails: c.skillDetails,
    }))
  ).slice(0, 8)

  const candidateMap = Object.fromEntries(allCandidates.map((c) => [c.id, c]))

  const deleteProjectAction = deleteProject.bind(null, params.id)

  return (
    <DashboardShell title={project.title}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="btn-secondary btn-sm">← 一覧へ</Link>
        <Link href={`/projects/${params.id}/edit`} className="btn-primary btn-sm">
          <Edit className="w-3.5 h-3.5" />編集
        </Link>
        <form action={deleteProjectAction}>
          <DeleteButton label="削除" />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 案件詳細 */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{project.clientName ?? ''}</p>
              </div>
              <ProjectStatusBadge status={project.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
              <div>
                <dt className="text-gray-500">勤務形態</dt>
                <dd><WorkStyleBadge style={project.workStyle} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">稼働時間</dt>
                <dd className="font-medium">{project.workHours ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">希望単価</dt>
                <dd className="font-medium text-green-700">{formatRate(project.desiredRate)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">最低単価</dt>
                <dd className="font-medium">{formatRate(project.minimumRate)}</dd>
              </div>
            </dl>

            {project.description && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">業務内容</p>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{project.description}</p>
              </div>
            )}

            {project.requiredSkills && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">必須スキル</p>
                <p className="text-sm text-gray-800">{project.requiredSkills}</p>
              </div>
            )}

            {project.workConditions && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">稼働条件・備考</p>
                <p className="text-sm text-gray-800">{project.workConditions}</p>
              </div>
            )}
          </div>

          {/* もらった案件（受信版） */}
          <ReceivedProjectsSection
            projectId={project.id}
            projectTitle={project.title}
            received={project.receivedProjects.map((r) => ({
              id: r.id,
              sourceName: r.sourceName,
              title: r.title,
              description: r.description,
              memo: r.memo,
              receivedAt: r.receivedAt.toISOString(),
            }))}
          />

          {/* 関連面談 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="section-title mb-0">関連面談</h4>
              <Link
                href={`/interviews/new?projectId=${params.id}&redirectTo=/projects/${params.id}`}
                className="btn-primary btn-sm"
              >
                <Plus className="w-3.5 h-3.5" />面談追加
              </Link>
            </div>
            {project.interviews.length === 0 ? (
              <p className="text-sm text-gray-400">面談はありません</p>
            ) : (
              <div className="space-y-2">
                {project.interviews.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <Link
                        href={`/candidates/${iv.candidateId}`}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        {iv.candidate.name}
                      </Link>
                      <p className="text-xs text-gray-500">{formatDateTime(iv.interviewDateTime)}</p>
                    </div>
                    <InterviewResultBadge result={iv.result} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* サイドバー: マッチング候補 */}
        <div>
          <div className="card p-4">
            <h4 className="section-title flex items-center gap-1.5">
              <span className="text-yellow-500">★</span> 合いそうな候補者
            </h4>
            {matchResults.length === 0 ? (
              <p className="text-sm text-gray-400">マッチする候補者が見つかりません</p>
            ) : (
              <div className="space-y-3">
                {matchResults.map((m) => {
                  const candidate = candidateMap[m.candidateId]
                  if (!candidate) return null
                  return (
                    <div key={m.candidateId} className="border border-blue-100 rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="text-sm font-medium text-blue-700 hover:underline"
                        >
                          {candidate.name}
                        </Link>
                        <span className="text-xs font-bold text-blue-600">{m.score}pt</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {candidate.age ? `${candidate.age}歳` : ''} {candidate.address ?? ''}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {m.matchedReasons.map((r) => (
                          <span key={r} className="text-xs bg-white border border-blue-200 text-blue-600 px-1.5 py-0.5 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
