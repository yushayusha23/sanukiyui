import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateForm } from '@/components/candidates/CandidateForm'
import { updateCandidate } from '@/lib/actions/candidates'

export default async function EditCandidatePage({ params }: { params: { id: string } }) {
  const [candidate, clients] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: params.id },
      include: { skillDetails: true },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, codeName: true } }),
  ])
  if (!candidate) notFound()

  const updateAction = updateCandidate.bind(null, params.id)

  return (
    <DashboardShell title={`${candidate.name} - 編集`}>
      <CandidateForm
        candidate={candidate}
        action={updateAction}
        backHref={`/candidates/${params.id}`}
        clients={clients}
      />
    </DashboardShell>
  )
}
