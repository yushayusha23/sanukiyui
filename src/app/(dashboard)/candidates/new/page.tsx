import { DashboardShell } from '@/components/layout/DashboardShell'
import { CandidateForm } from '@/components/candidates/CandidateForm'
import { createCandidate } from '@/lib/actions/candidates'

export default function NewCandidatePage() {
  return (
    <DashboardShell title="求職者 新規登録">
      <CandidateForm
        action={createCandidate}
        backHref="/candidates"
      />
    </DashboardShell>
  )
}
