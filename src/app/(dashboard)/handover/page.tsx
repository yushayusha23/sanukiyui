import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { createHandoverNote } from '@/lib/actions/handover'
import { HandoverCard } from '@/components/handover/HandoverCard'
import { ClipboardList } from 'lucide-react'

export default async function HandoverPage() {
  const notes = await prisma.handoverNote.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const pending = notes.filter((n) => n.status === 'PENDING')
  const done = notes.filter((n) => n.status === 'DONE')

  return (
    <DashboardShell title="引き継ぎ">
      <div className="max-w-2xl space-y-6">
        {/* 追加フォーム */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4" />
            新しい引き継ぎを追加
          </h3>
          <form action={createHandoverNote} className="space-y-3">
            <div>
              <label className="form-label">タイトル <span className="text-red-500">*</span></label>
              <input name="title" required className="form-input" placeholder="例: 〇〇案件の対応状況を確認する" />
            </div>
            <div>
              <label className="form-label">詳細・メモ</label>
              <textarea name="body" rows={3} className="form-textarea" placeholder="詳細な内容や手順を記載..." />
            </div>
            <div>
              <label className="form-label">担当者</label>
              <input name="assignee" className="form-input" placeholder="例: 田中" />
            </div>
            <button type="submit" className="btn-primary">追加</button>
          </form>
        </div>

        {/* 未対応 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            未対応 <span className="text-yellow-600">({pending.length})</span>
          </h3>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">未対応の引き継ぎはありません</p>
          ) : (
            <div className="space-y-2">
              {pending.map((n) => (
                <HandoverCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  body={n.body}
                  assignee={n.assignee}
                  status={n.status}
                  createdAt={n.createdAt.toISOString()}
                />
              ))}
            </div>
          )}
        </div>

        {/* 済み */}
        {done.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              済み <span className="text-green-600">({done.length})</span>
            </h3>
            <div className="space-y-2">
              {done.map((n) => (
                <HandoverCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  body={n.body}
                  assignee={n.assignee}
                  status={n.status}
                  createdAt={n.createdAt.toISOString()}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
