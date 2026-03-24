import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateForm } from '@/components/candidates/CandidateForm'
import { createCandidate } from '@/lib/actions/candidates'
import { prisma } from '@/lib/prisma'

export default async function NewCandidatePage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, codeName: true },
  })

  return (
    <DashboardShell title="人材 新規登録">
      <CandidateForm
        action={createCandidate}
        backHref="/candidates"
        clients={clients}
      />
    </DashboardShell>
  )
}
