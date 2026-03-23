import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { updateProject } from '@/lib/actions/projects'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) notFound()

  const updateAction = updateProject.bind(null, params.id)

  return (
    <DashboardShell title={`${project.title} - 編集`}>
      <ProjectForm
        project={project}
        action={updateAction}
        backHref={`/projects/${params.id}`}
      />
    </DashboardShell>
  )
}
