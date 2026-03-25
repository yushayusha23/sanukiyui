'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Paperclip, Sparkles, X } from 'lucide-react'

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
  onFileSelected?: (file: File) => void
}

const ACCEPTED = '.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt'

function isSupported(filename: string) {
  const n = filename.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.xlsx') || n.endsWith('.xls') ||
    n.endsWith('.docx') || n.endsWith('.doc') || n.endsWith('.csv') || n.endsWith('.txt')
}

export function SkillSheetUploader({ onExtracted, onFileSelected }: SkillSheetUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'ready' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File) {
    if (!isSupported(file.name)) {
      setErrorMsg('対応形式: PDF / Excel / Word / CSV')
      setStatus('error')
      return
    }
    setSelectedFile(file)
    setStatus('ready')
    setErrorMsg('')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function handleManual() {
    if (!selectedFile) return
    onFileSelected?.(selectedFile)
    setStatus('success')
  }

  async function handleAI() {
    if (!selectedFile) return
    setStatus('loading')
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const res = await fetch('/api/parse-skillsheet', { method: 'POST', body: formData })
      const text = await res.text()
      let json: { error?: string; data?: Record<string, unknown> } = {}
      try { json = JSON.parse(text) } catch { /* empty */ }
      if (!res.ok) throw new Error(json.error || `エラーが発生しました (${res.status})`)
      onExtracted(json.data ?? {})
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '解析に失敗しました')
      setStatus('error')
    }
  }

  function reset() {
    setSelectedFile(null)
    setStatus('idle')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
      />

      {/* ファイル未選択 */}
      {status === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
            ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-green-50/50'}`}
        >
          <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">PDF / Excel / Word / CSV</p>
        </div>
      )}

      {/* エラー */}
      {status === 'error' && (
        <div className="border-2 border-dashed border-red-200 rounded-lg p-3 bg-red-50 cursor-pointer" onClick={() => inputRef.current?.click()}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-500 flex-1">{errorMsg}</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); reset() }}><X className="w-3.5 h-3.5 text-red-300" /></button>
          </div>
        </div>
      )}

      {/* ファイル選択済み → 操作ボタン表示 */}
      {status === 'ready' && selectedFile && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600 flex-1 truncate">{selectedFile.name}</p>
            <button type="button" onClick={reset}><X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleManual}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              添付のみ
            </button>
            <button
              type="button"
              onClick={handleAI}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI自動入力
            </button>
          </div>
        </div>
      )}

      {/* AI解析中 */}
      {status === 'loading' && (
        <div className="border border-green-200 rounded-lg p-3 bg-green-50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-green-500 animate-spin flex-shrink-0" />
            <p className="text-xs text-green-600">AI解析中...</p>
          </div>
        </div>
      )}

      {/* 完了 */}
      {status === 'success' && (
        <div className="border border-green-200 rounded-lg p-3 bg-green-50 cursor-pointer" onClick={() => inputRef.current?.click()}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-600 flex-1">
              {selectedFile?.name}
            </p>
            <button type="button" onClick={(e) => { e.stopPropagation(); reset() }}><X className="w-3.5 h-3.5 text-green-300 hover:text-green-500" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
