import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateStatusBadge, WorkStyleBadge, ContactTypeBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatDateTime, formatRate, isOverdue } from '@/lib/utils'
import Link from 'next/link'
import { Edit, Plus, AlertCircle, MessageCircle, FileText } from 'lucide-react'
import { matchCandidateToProjects } from '@/lib/matching'
import { DeleteButton } from '@/components/ui/DeleteButton'
import { deleteCandidate } from '@/lib/actions/candidates'
import { LineSendButton } from '@/components/candidates/LineSendButton'
import { isLineConfigured } from '@/lib/line'
import { ProjectLinksSection } from '@/components/candidates/ProjectLinksSection'
import { InterviewSection } from '@/components/candidates/InterviewSection'

async function getCandidate(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      skillDetails: true,
      client: { select: { id: true, name: true, codeName: true } },
      documents: { orderBy: { createdAt: 'desc' } },
      interviews: {
        include: { project: true },
        orderBy: { interviewDateTime: 'desc' },
      },
      communications: {
        orderBy: { contactedAt: 'desc' },
      },
      matches: {
        include: {
          project: { select: { id: true, title: true, clientName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidate(params.id)
  if (!candidate) notFound()

  // 全案件取得（マッチング候補 + 紐付けフォーム用）
  const allProjects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, clientName: true, status: true,
      requiredSkills: true, description: true, workConditions: true,
      workStyle: true, workHours: true,
      rateType: true, rateMin: true, rateMax: true, desiredRate: true, minimumRate: true,
      isYearsRequired: true, fsYearsRequired: true, saasYearsRequired: true,
      startDate: true },
  })
  const activeProjects = allProjects.filter((p) =>
    ['RECRUITING', 'PROPOSING'].includes(p.status)
  )

  // マッチング: この人に合いそうな案件
  const matchResults = matchCandidateToProjects(
    {
      id: candidate.id,
      name: candidate.name,
      preferredWorkStyle: candidate.preferredWorkStyle,
      preferredWorkHours: candidate.preferredWorkHours,
      desiredHourlyRate: candidate.desiredHourlyRate,
      minimumHourlyRate: candidate.minimumHourlyRate,
      availableStartDate: candidate.availableStartDate,
      workHistory: candidate.workHistory,
      skillDetails: candidate.skillDetails,
    },
    activeProjects
  ).slice(0, 5)

  const projectMap = Object.fromEntries(activeProjects.map((p) => [p.id, p]))

  // 案件履歴: matches + interviews を統合
  const interviewByProject: Record<string, { result: string | null; dateTime: Date }> = {}
  for (const iv of candidate.interviews) {
    if (iv.projectId) {
      // 同じプロジェクトの面談は最新1件を使用
      if (!interviewByProject[iv.projectId] ||
          iv.interviewDateTime > interviewByProject[iv.projectId].dateTime) {
        interviewByProject[iv.projectId] = {
          result: iv.result,
          dateTime: iv.interviewDateTime,
        }
      }
    }
  }

  // matches から ProjectEntry を作成
  const projectEntries = candidate.matches.map((m) => ({
    matchId: m.id,
    projectId: m.projectId,
    projectTitle: m.project.title,
    clientName: m.project.clientName,
    matchStatus: m.status as 'SUGGESTED' | 'ACCEPTED' | 'REJECTED',
    interviewResult: interviewByProject[m.projectId]?.result ?? null,
    interviewDateTime: interviewByProject[m.projectId]?.dateTime?.toISOString() ?? null,
  }))

  // interviews にあるがmatchesにない案件も追加（自動反映）
  for (const iv of candidate.interviews) {
    if (iv.projectId && iv.project && !candidate.matches.find((m) => m.projectId === iv.projectId)) {
      // 面談結果からstatus推定
      const status = iv.result === 'FAILED' ? 'REJECTED'
        : iv.result === 'PASSED' ? 'ACCEPTED'
        : 'SUGGESTED'
      projectEntries.push({
        matchId: `interview-${iv.id}`, // 仮ID（matchなし）
        projectId: iv.projectId,
        projectTitle: iv.project.title,
        clientName: iv.project.clientName ?? null,
        matchStatus: status as 'SUGGESTED' | 'ACCEPTED' | 'REJECTED',
        interviewResult: iv.result,
        interviewDateTime: iv.interviewDateTime.toISOString(),
      })
    }
  }

  const deleteCandidateAction = deleteCandidate.bind(null, params.id)
  const lineConfigured = isLineConfigured()

  return (
    <DashboardShell title={candidate.name}>
      {/* ヘッダー操作 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/candidates" className="btn-secondary btn-sm">← 一覧へ</Link>
        <Link href={`/candidates/${params.id}/edit`} className="btn-primary btn-sm">
          <Edit className="w-3.5 h-3.5" />編集
        </Link>
        <LineSendButton
          candidateId={candidate.id}
          candidateName={candidate.name}
          hasLineId={!!candidate.lineUserId && lineConfigured}
        />
        <form action={deleteCandidateAction}>
          <DeleteButton label="削除" />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {candidate.age ? `${candidate.age}歳` : ''} {candidate.address ?? ''}
                </p>
              </div>
              <CandidateStatusBadge status={candidate.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">所属会社</dt>
                <dd className="font-medium">
                  {candidate.client
                    ? `${candidate.client.name}${candidate.client.codeName ? ` (${candidate.client.codeName})` : ''}`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">希望勤務形態</dt>
                <dd><WorkStyleBadge style={candidate.preferredWorkStyle} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">希望単価</dt>
                <dd className="font-medium">{formatRate(candidate.desiredHourlyRate)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">最低希望単価</dt>
                <dd className="font-medium">{formatRate(candidate.minimumHourlyRate)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">稼働開始可能日</dt>
                <dd className="font-medium">{formatDate(candidate.availableStartDate)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">面談確定日時</dt>
                <dd className="font-medium text-blue-600">{formatDateTime(candidate.confirmedInterviewDate)}</dd>
              </div>
            </dl>

            {/* LINE連携状態 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#06C755]" />
                  <span className="text-sm text-gray-500">LINE</span>
                </div>
                {candidate.lineUserId ? (
                  <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    連携済み
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                    未連携
                  </span>
                )}
              </div>
              {!candidate.lineUserId && (
                <p className="text-xs text-gray-400 mt-1.5">
                  編集画面でLINE IDを設定すると、LINEでメッセージを送受信できます
                </p>
              )}
              {candidate.lineUserId && !lineConfigured && (
                <p className="text-xs text-orange-500 mt-1.5">
                  ⚠ .env に LINE_CHANNEL_ACCESS_TOKEN が未設定です
                </p>
              )}
            </div>

            {candidate.workHistory && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">職歴</p>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{candidate.workHistory}</p>
              </div>
            )}

            {candidate.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">備考</p>
                <p className="text-sm text-gray-800">{candidate.notes}</p>
              </div>
            )}
          </div>

          {/* スキル詳細 */}
          {candidate.skillDetails && (
            <div className="card p-5">
              <h4 className="section-title">スキル詳細</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {candidate.skillDetails.isYears != null && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{candidate.skillDetails.isYears}年</p>
                    <p className="text-xs text-blue-600 mt-0.5">IS経験</p>
                  </div>
                )}
                {candidate.skillDetails.ifYears != null && (
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{candidate.skillDetails.ifYears}年</p>
                    <p className="text-xs text-indigo-600 mt-0.5">IF経験</p>
                  </div>
                )}
                {candidate.skillDetails.saasYears != null && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{candidate.skillDetails.saasYears}年</p>
                    <p className="text-xs text-purple-600 mt-0.5">SaaS経験</p>
                  </div>
                )}
              </div>

              <dl className="space-y-2 text-sm">
                {candidate.skillDetails.tools && (
                  <div>
                    <dt className="text-gray-500">使用ツール</dt>
                    <dd className="font-medium">{candidate.skillDetails.tools}</dd>
                  </div>
                )}
                {candidate.skillDetails.strengths && (
                  <div>
                    <dt className="text-gray-500">得意領域</dt>
                    <dd className="font-medium">{candidate.skillDetails.strengths}</dd>
                  </div>
                )}
                {candidate.skillDetails.otherBpoExperience && (
                  <div>
                    <dt className="text-gray-500">その他BPO経験</dt>
                    <dd className="font-medium">{candidate.skillDetails.otherBpoExperience}</dd>
                  </div>
                )}
                {candidate.skillDetails.freeSkillNote && (
                  <div>
                    <dt className="text-gray-500">スキル補足</dt>
                    <dd className="whitespace-pre-wrap">{candidate.skillDetails.freeSkillNote}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* 連絡履歴 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="section-title mb-0">連絡履歴</h4>
              <Link
                href={`/communications?candidateId=${params.id}&redirectTo=/candidates/${params.id}`}
                className="btn-primary btn-sm"
              >
                <Plus className="w-3.5 h-3.5" />追加
              </Link>
            </div>
            {candidate.communications.length === 0 ? (
              <p className="text-sm text-gray-400">連絡履歴がありません</p>
            ) : (
              <div className="space-y-3">
                {candidate.communications.map((comm) => (
                  <div key={comm.id} className={`border rounded-lg p-3 ${
                    !comm.replied && comm.nextContactDate && isOverdue(comm.nextContactDate)
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ContactTypeBadge type={comm.type} />
                        <span className="text-xs text-gray-500">{formatDateTime(comm.contactedAt)}</span>
                      </div>
                      <span className={`text-xs font-medium ${comm.replied ? 'text-green-600' : 'text-orange-600'}`}>
                        {comm.replied ? '返信あり' : '返信待ち'}
                      </span>
                    </div>
                    {comm.memo && <p className="text-sm text-gray-700">{comm.memo}</p>}
                    {comm.nextContactDate && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        isOverdue(comm.nextContactDate) ? 'text-red-600 font-medium' : 'text-blue-600'
                      }`}>
                        {isOverdue(comm.nextContactDate) && <AlertCircle className="w-3 h-3" />}
                        次回連絡: {formatDate(comm.nextContactDate)}
                        {isOverdue(comm.nextContactDate) && ' (期限超過)'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 案件履歴（応募済み・NG） */}
          <ProjectLinksSection
            candidateId={candidate.id}
            entries={projectEntries}
            availableProjects={allProjects.map((p) => ({
              id: p.id,
              title: p.title,
              clientName: p.clientName,
            }))}
          />

          {/* 面談履歴 */}
          <InterviewSection
            candidateId={candidate.id}
            interviews={candidate.interviews.map((iv) => ({
              id: iv.id,
              interviewDateTime: iv.interviewDateTime.toISOString(),
              result: iv.result,
              interviewer: iv.interviewer,
              memo: iv.memo,
              evaluation: iv.evaluation,
              project: iv.project ? { id: iv.project.id, title: iv.project.title } : null,
            }))}
            availableProjects={allProjects.map((p) => ({ id: p.id, title: p.title }))}
          />
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* ドキュメント */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="section-title mb-0">スキルシート</h4>
            </div>
            <PdfUploader candidateId={params.id} documents={candidate.documents} />
          </div>

          {/* マッチング候補案件 */}
          <div className="card p-4">
            <h4 className="section-title flex items-center gap-1.5">
              <span className="text-yellow-500">★</span> 合いそうな案件
            </h4>
            {matchResults.length === 0 ? (
              <p className="text-sm text-gray-400">マッチする案件が見つかりません</p>
            ) : (
              <div className="space-y-3">
                {matchResults.map((m) => {
                  const project = projectMap[m.projectId]
                  if (!project) return null
                  return (
                    <div key={m.projectId} className="border border-blue-100 rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-medium text-blue-700 hover:underline truncate"
                        >
                          {project.title}
                        </Link>
                        <span className="text-xs font-bold text-blue-600 ml-2">
                          {m.score}pt
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{project.clientName}</p>
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

// クライアントコンポーネントとして別ファイルが理想だが、ここに同梱
import PdfUploadForm from '@/components/candidates/PdfUploadForm'
import DocumentViewer from '@/components/candidates/DocumentViewer'

// スキルシートセクション
function PdfUploader({
  candidateId,
  documents,
}: {
  candidateId: string
  documents: { id: string; fileName: string; filePath: string; createdAt: Date }[]
}) {
  return (
    <div>
      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">書類がありません</p>
      ) : (
        <div className="space-y-2 mb-3">
          {documents.map((doc) => (
            <DocumentViewer key={doc.id} doc={doc} />
          ))}
        </div>
      )}
      <PdfUploadForm candidateId={candidateId} />
    </div>
  )
}
