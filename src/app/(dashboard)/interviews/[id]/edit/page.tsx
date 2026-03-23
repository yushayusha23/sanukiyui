import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { InterviewForm } from '@/components/interviews/InterviewForm'
import { updateInterview } from '@/lib/actions/interviews'

export default async function EditInterviewPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { redirectTo?: string }
}) {
  const [interview, candidates, projects] = await Promise.all([
    prisma.interview.findUnique({ where: { id: params.id } }),
    prisma.candidate.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])

  if (!interview) notFound()

  const redirectTo = searchParams.redirectTo ?? '/interviews'
  const updateAction = updateInterview.bind(null, params.id)

  return (
    <DashboardShell title="面談 編集">
      <InterviewForm
        action={updateAction}
        candidates={candidates}
        projects={projects}
        defaultCandidateId={interview.candidateId}
        defaultProjectId={interview.projectId ?? undefined}
        defaultInterviewDateTime={interview.interviewDateTime.toISOString()}
        defaultInterviewer={interview.interviewer ?? undefined}
        defaultResult={interview.result ?? undefined}
        defaultEvaluation={interview.evaluation ?? undefined}
        defaultMemo={interview.memo ?? undefined}
        backHref={redirectTo}
        redirectTo={redirectTo}
      />
    </DashboardShell>
  )
}
