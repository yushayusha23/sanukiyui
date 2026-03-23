import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { createProject } from '@/lib/actions/projects'

export default function NewProjectPage() {
  return (
    <DashboardShell title="案件 新規登録">
      <ProjectForm action={createProject} backHref="/projects" />
    </DashboardShell>
  )
}
