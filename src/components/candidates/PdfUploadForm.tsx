'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

export default function PdfUploadForm({ candidateId }: { candidateId: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('candidateId', candidateId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const text = await res.text()
      let json: { error?: string } = {}
      try { json = JSON.parse(text) } catch { /* empty */ }

      if (!res.ok) {
        setError(json.error ?? 'アップロードに失敗しました')
      } else {
        router.refresh()
      }
    } catch {
      setError('アップロードに失敗しました')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2">
        <Upload className="w-3.5 h-3.5" />
        {uploading ? '送信中...' : 'ファイルを追加'}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.docx,.doc,.csv"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
