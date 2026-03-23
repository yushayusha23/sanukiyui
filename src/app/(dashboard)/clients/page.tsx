import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { deleteClient } from '@/lib/actions/clients'
import { DeleteButton } from '@/components/ui/DeleteButton'
import Link from 'next/link'
import { Plus, AlertTriangle, Pencil } from 'lucide-react'

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  TALENT:  { label: '人材元',   color: 'bg-blue-100 text-blue-700' },
  PROJECT: { label: '案件元',   color: 'bg-green-100 text-green-700' },
  BOTH:    { label: '両方',     color: 'bg-purple-100 text-purple-700' },
}

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const cautions = clients.filter((c) => c.caution)
  const normal = clients.filter((c) => !c.caution)

  return (
    <DashboardShell title="クライアント一覧">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/clients/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新規追加
          </Link>
        </div>

        {/* 要注意クライアント */}
        {cautions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4" />
              要注意（{cautions.length}社）
            </h3>
            <div className="space-y-2">
              {cautions.map((c) => <ClientCard key={c.id} client={c} />)}
            </div>
          </div>
        )}

        {/* 通常クライアント */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            クライアント一覧（{normal.length}社）
          </h3>
          {normal.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">クライアントが登録されていません</p>
          ) : (
            <div className="space-y-2">
              {normal.map((c) => <ClientCard key={c.id} client={c} />)}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function ClientCard({ client }: {
  client: {
    id: string
    name: string
    codeName: string | null
    type: string
    caution: boolean
    cautionNote: string | null
    memo: string | null
  }
}) {
  const typeInfo = TYPE_LABEL[client.type] ?? TYPE_LABEL.BOTH
  const deleteAction = deleteClient.bind(null, client.id)

  return (
    <div className={`card p-4 ${client.caution ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/clients/${client.id}`} className="font-semibold text-blue-700 hover:underline">{client.name}</Link>
            {client.codeName && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                {client.codeName}
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {client.caution && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" />
                要注意
              </span>
            )}
          </div>
          {client.cautionNote && (
            <p className="text-sm text-red-600 mt-1">⚠️ {client.cautionNote}</p>
          )}
          {client.memo && (
            <p className="text-sm text-gray-500 mt-1">{client.memo}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/clients/${client.id}/edit`} className="btn-secondary btn-sm">
            <Pencil className="w-3.5 h-3.5" />
            編集
          </Link>
          <form action={deleteAction}>
            <DeleteButton label="削除" />
          </form>
        </div>
      </div>
    </div>
  )
}
