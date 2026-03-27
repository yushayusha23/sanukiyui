'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

export function SourceTextCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
        >
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          元テキスト
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-stone-50 transition-colors"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-green-500" />コピー済み</>
            : <><Copy className="w-3.5 h-3.5" />全文コピー</>
          }
        </button>
      </div>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-stone-50 rounded-lg p-4 border border-gray-100 max-h-64 overflow-y-auto">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}
