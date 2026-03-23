import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import Link from 'next/link'
import { Plus, Edit2, MessageCircle, Mail, Phone, FileText } from 'lucide-react'
import { TemplateCopyButton } from '@/components/templates/TemplateCopyButton'
import { TemplateDeleteButton } from '@/components/templates/TemplateDeleteButton'

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  LINE:  { label: 'LINE',   icon: MessageCircle, color: 'text-green-600 bg-green-50 border-green-200',   dot: 'bg-green-500' },
  EMAIL: { label: 'メール', icon: Mail,          color: 'text-blue-600 bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  PHONE: { label: '電話',   icon: Phone,         color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  OTHER: { label: 'その他', icon: FileText,      color: 'text-gray-600 bg-gray-50 border-gray-200',     dot: 'bg-gray-400' },
}

const CATEGORY_ORDER = ['LINE', 'EMAIL', 'PHONE', 'OTHER']

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
  })

  // カテゴリ別にグループ化
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof templates>>((acc, cat) => {
    acc[cat] = templates.filter((t) => t.category === cat)
    return acc
  }, {})

  return (
    <DashboardShell title="テンプレート">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          連絡・メッセージ用の定型文を管理します
        </p>
        <Link href="/templates/new" className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          新規作成
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">テンプレートがありません</p>
          <p className="text-sm text-gray-400 mb-4">よく使うメッセージを登録しておくと便利です</p>
          <Link href="/templates/new" className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            最初のテンプレートを作成
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat]
            if (items.length === 0) return null
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            return (
              <div key={cat}>
                {/* カテゴリヘッダー */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    {meta.label}
                    <span className="text-gray-400 font-normal">({items.length}件)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map((tmpl) => (
                    <div key={tmpl.id} className="card p-4 flex flex-col gap-3">
                      {/* タイトル行 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{tmpl.title}</h4>
                          {tmpl.memo && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tmpl.memo}</p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>

                      {/* 本文プレビュー */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex-1">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed line-clamp-6">
                          {tmpl.body}
                        </pre>
                      </div>

                      {/* 操作ボタン */}
                      <div className="flex items-center gap-2 pt-1">
                        <TemplateCopyButton text={tmpl.body} />
                        <Link
                          href={`/templates/${tmpl.id}/edit`}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          編集
                        </Link>
                        <TemplateDeleteButton id={tmpl.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
