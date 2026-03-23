import { DashboardShell } from '@/components/layout/DashboardShell'
import { createClient } from '@/lib/actions/clients'
import Link from 'next/link'
import { ClientForm } from '@/components/clients/ClientForm'

export default function NewClientPage() {
  return (
    <DashboardShell title="クライアント新規追加">
      <div className="max-w-lg">
        <Link href="/clients" className="btn-secondary btn-sm mb-6 inline-flex">← 一覧へ</Link>
        <div className="card p-6">
          <ClientForm action={createClient} />
        </div>
      </div>
    </DashboardShell>
  )
}
