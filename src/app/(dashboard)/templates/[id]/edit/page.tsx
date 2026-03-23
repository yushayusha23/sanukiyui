import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { TemplateForm } from '@/components/templates/TemplateForm'
import { updateTemplate } from '@/lib/actions/templates'

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) notFound()

  const updateAction = updateTemplate.bind(null, params.id)

  return (
    <DashboardShell title="テンプレート 編集">
      <TemplateForm
        action={updateAction}
        defaultValues={{
          title:    template.title,
          category: template.category,
          body:     template.body,
          memo:     template.memo ?? undefined,
        }}
        backHref="/templates"
      />
    </DashboardShell>
  )
}
