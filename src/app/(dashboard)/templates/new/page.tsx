import { DashboardShell } from '@/components/layout/DashboardShell'
import { TemplateForm } from '@/components/templates/TemplateForm'
import { createTemplate } from '@/lib/actions/templates'

export default function NewTemplatePage() {
  return (
    <DashboardShell title="テンプレート 新規作成">
      <TemplateForm
        action={createTemplate}
        backHref="/templates"
      />
    </DashboardShell>
  )
}
