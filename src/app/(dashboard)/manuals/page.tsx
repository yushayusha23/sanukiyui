import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { createManual } from '@/lib/actions/manuals'
import { ManualFolder } from '@/components/manuals/ManualFolder'
import { BookOpen, FolderOpen } from 'lucide-react'

export default async function ManualsPage() {
  const manuals = await prisma.manual.findMany({
    orderBy: [{ folder: 'asc' }, { createdAt: 'desc' }],
  })

  // フォルダごとにグループ化
  const folderMap = new Map<string, typeof manuals>()
  for (const m of manuals) {
    if (!folderMap.has(m.folder)) folderMap.set(m.folder, [])
    folderMap.get(m.folder)!.push(m)
  }
  const folders = Array.from(folderMap.entries())

  // 既存フォルダ名リスト（セレクトに使用）
  const existingFolders = Array.from(folderMap.keys())

  return (
    <DashboardShell title="マニュアル">
      <div className="max-w-3xl space-y-6">

        {/* 追加フォーム */}
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" />
            マニュアルを追加
          </h3>
          <form action={createManual} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">タイトル <span className="text-red-500">*</span></label>
                <input name="title" required className="form-input" placeholder="例: 面談後の連絡手順" />
              </div>
              <div>
                <label className="form-label">フォルダ</label>
                <input
                  name="folder"
                  className="form-input"
                  placeholder="例: 人材対応 / 案件管理"
                  list="folder-list"
                />
                <datalist id="folder-list">
                  {existingFolders.map(f => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="form-label">内容</label>
              <textarea
                name="content"
                rows={5}
                className="form-input resize-y"
                placeholder="手順や注意事項を入力..."
              />
            </div>
            <div>
              <label className="form-label">補足メモ</label>
              <input name="memo" className="form-input" placeholder="例: 〇〇さんに確認すること" />
            </div>
            <button type="submit" className="btn-primary">
              追加する
            </button>
          </form>
        </div>

        {/* フォルダ一覧 */}
        {folders.length === 0 ? (
          <div className="card p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">マニュアルがありません。上から追加してください。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {folders.map(([folder, items]) => (
              <ManualFolder key={folder} folder={folder} manuals={items} />
            ))}
          </div>
        )}

      </div>
    </DashboardShell>
  )
}
