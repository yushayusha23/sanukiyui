'use client'

import { useState } from 'react'
import { FileText, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { PdfPreview } from './PdfPreview'

interface Doc {
  id: string
  fileName: string
  filePath: string
  createdAt: Date
}

export default function DocumentViewer({ doc }: { doc: Doc }) {
  const [open, setOpen] = useState(false)
  const isPdf = doc.fileName.toLowerCase().endsWith('.pdf')

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* ファイル名バー */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 flex-1 truncate">{doc.fileName}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isPdf && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors"
            >
              {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {open ? '閉じる' : '確認'}
            </button>
          )}
          <a
            href={doc.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* PDFインラインプレビュー（ズーム対応） */}
      {open && isPdf && (
        <div className="border-t border-gray-100">
          <PdfPreview src={doc.filePath} title={doc.fileName} />
        </div>
      )}

      {/* PDF以外はプレビュー非対応メッセージ */}
      {open && !isPdf && (
        <div className="px-3 py-3 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
          このファイル形式はインライン表示非対応です。上の↗ボタンで開いてください。
        </div>
      )}
    </div>
  )
}
