import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { updateClient } from '@/lib/actions/clients'
import Link from 'next/link'
import { ClientForm } from '@/components/clients/ClientForm'

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) notFound()

  const action = updateClient.bind(null, client.id)

  return (
    <DashboardShell title="クライアント編集">
      <div className="max-w-lg">
        <Link href="/clients" className="btn-secondary btn-sm mb-6 inline-flex">← 一覧へ</Link>
        <div className="card p-6">
          <ClientForm
            action={action}
            defaultName={client.name}
            defaultCodeName={client.codeName ?? undefined}
            defaultType={client.type}
            defaultCaution={client.caution}
            defaultCautionNote={client.cautionNote ?? undefined}
            defaultMemo={client.memo ?? undefined}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
