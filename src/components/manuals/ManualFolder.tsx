'use client'

import { useState } from 'react'
import { ChevronDown, Folder, Trash2, FileText, ChevronRight } from 'lucide-react'
import { deleteManual } from '@/lib/actions/manuals'

type Manual = {
  id: string
  title: string
  folder: string
  content: string | null
  memo: string | null
  createdAt: Date
  updatedAt: Date
}

export function ManualFolder({ folder, manuals }: { folder: string; manuals: Manual[] }) {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('このマニュアルを削除しますか？')) return
    await deleteManual(id)
  }

  return (
    <div className="card overflow-hidden">
      {/* フォルダヘッダー */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors text-left border-b border-green-100"
      >
        <Folder className="w-4 h-4 text-green-700 flex-shrink-0" />
        <span className="text-sm font-semibold text-green-900 flex-1">{folder}</span>
        <span className="text-xs text-green-600 mr-2">{manuals.length}件</span>
        <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>

      {/* マニュアル一覧 */}
      {open && (
        <div className="divide-y divide-gray-100">
          {manuals.map(m => (
            <div key={m.id}>
              {/* タイトル行 */}
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {expanded === m.id
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  }
                  <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">{m.title}</span>
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 展開：内容表示 */}
              {expanded === m.id && (
                <div className="px-10 pb-4 bg-gray-50 border-t border-gray-100">
                  {m.content ? (
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-3 font-sans">
                      {m.content}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-400 mt-3 italic">内容が登録されていません</p>
                  )}
                  {m.memo && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      📝 {m.memo}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
