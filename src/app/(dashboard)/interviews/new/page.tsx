import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { createInterview } from '@/lib/actions/interviews'
import { InterviewForm } from '@/components/interviews/InterviewForm'

interface SearchParams {
  candidateId?: string
  projectId?: string
  redirectTo?: string
  date?: string  // カレンダーから遷移時のデフォルト日付 (YYYY-MM-DD)
}

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [candidates, projects] = await Promise.all([
    prisma.candidate.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
  ])

  return (
    <DashboardShell title="面談 新規登録">
      <InterviewForm
        action={createInterview}
        candidates={candidates}
        projects={projects}
        defaultCandidateId={searchParams.candidateId}
        defaultProjectId={searchParams.projectId}
        defaultDate={searchParams.date}
        redirectTo={searchParams.redirectTo ?? '/interviews'}
        backHref={searchParams.redirectTo ?? '/calendar'}
      />
    </DashboardShell>
  )
}
