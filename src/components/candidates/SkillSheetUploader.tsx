'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface ExtractedData {
  name?: string
  age?: number | null
  address?: string | null
  workHistory?: string | null
  isYears?: number | null
  fsYears?: number | null
  saasYears?: number | null
  desiredHourlyRate?: number | null
  availableStartDate?: string | null
  notes?: string | null
  preferredWorkStyle?: string | null
}

interface SkillSheetUploaderProps {
  onExtracted: (data: ExtractedData) => void
}

export function SkillSheetUploader({ onExtracted }: SkillSheetUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    const isPdf = file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setErrorMsg('PDFファイルのみ対応しています')
      setStatus('error')
      return
    }

    setFileName(file.name)
    setStatus('loading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/parse-skillsheet', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || '解析に失敗しました')
      }

      onExtracted(json.data)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '解析に失敗しました')
      setStatus('error')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'}
          ${status === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {status === 'idle' && (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">スキルシートをドラッグ&ドロップ</p>
            <p className="text-xs text-gray-400 mt-1">またはクリックしてファイルを選択（PDF）</p>
          </>
        )}

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-green-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm font-medium text-gray-700">解析中...</p>
            <p className="text-xs text-gray-400 mt-1">{fileName}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">解析完了！フォームに自動入力しました</p>
            <p className="text-xs text-gray-400 mt-1">{fileName}</p>
            <p className="text-xs text-green-600 mt-2">別のファイルを読み込む場合はクリック</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
            <p className="text-xs text-gray-400 mt-1">クリックして再試行</p>
          </>
        )}
      </div>

      {status === 'idle' && (
        <div className="flex items-center gap-1.5 mt-2">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">
            名前・年齢・IS/FS/SaaS経験年数・希望単価などを自動入力します
          </p>
        </div>
      )}
    </div>
  )
}
