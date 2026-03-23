import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { createProject } from '@/lib/actions/projects'
import { prisma } from '@/lib/prisma'

export default async function NewProjectPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, codeName: true },
  })

  return (
    <DashboardShell title="案件 新規登録">
      <ProjectForm action={createProject} backHref="/projects" clients={clients} />
    </DashboardShell>
  )
}
