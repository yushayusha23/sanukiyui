'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Pencil, Sparkles } from 'lucide-react'

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
  onFileSelected?: (file: File) => void // 手動モード用
}

type Mode = 'choice' | 'manual' | 'auto'
type Status = 'idle' | 'loading' | 'success' | 'error'

const ACCEPTED = '.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt'

function isSupported(filename: string) {
  const n = filename.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.xlsx') || n.endsWith('.xls') ||
    n.endsWith('.docx') || n.endsWith('.doc') || n.endsWith('.csv') || n.endsWith('.txt')
}

export function SkillSheetUploader({ onExtracted, onFileSelected }: SkillSheetUploaderProps) {
  const [mode, setMode] = useState<Mode>('choice')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    if (!isSupported(file.name)) {
      setErrorMsg('対応形式: PDF / Excel / Word / CSV')
      setStatus('error')
      return
    }

    setFileName(file.name)

    if (mode === 'manual') {
      // 手動モード: ファイルを親に渡してそのまま完了
      onFileSelected?.(file)
      setStatus('success')
      return
    }

    // AIモード
    setStatus('loading')
    setErrorMsg('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/parse-skillsheet', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '解析に失敗しました')
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

  // モード選択画面
  if (mode === 'choice') {
    return (
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">🦕 スキルシートから登録</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50/50 transition-all text-center"
          >
            <Pencil className="w-7 h-7 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">シート添付＋手動入力</p>
              <p className="text-xs text-gray-400 mt-0.5">ファイルを添付して自分で入力</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('auto')}
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center"
          >
            <Sparkles className="w-7 h-7 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700">AIで自動入力</p>
              <p className="text-xs text-gray-400 mt-0.5">AIが項目を自動で埋める</p>
            </div>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">スキルシートなしで登録する場合は下のフォームへ</p>
      </div>
    )
  }

  // ファイルアップロード画面（手動 or AI）
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => { setMode('choice'); setStatus('idle') }} className="text-xs text-gray-400 hover:text-gray-600">← 戻る</button>
        <p className="text-sm font-medium text-gray-700">
          {mode === 'manual' ? '📎 シート添付（手動入力）' : '✨ AIで自動入力'}
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => status !== 'loading' && inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'}
          ${status === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${status === 'loading' ? 'cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {status === 'idle' && (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">ドラッグ&ドロップ</p>
            <p className="text-xs text-gray-400 mt-1">またはタップしてファイルを選択</p>
            <p className="text-xs text-gray-300 mt-1">PDF / Excel / Word / CSV</p>
          </>
        )}

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-green-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm font-medium text-gray-700">AI解析中...</p>
            <p className="text-xs text-gray-400 mt-1">{fileName}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">
              {mode === 'manual' ? 'ファイルを添付しました' : '解析完了！フォームに自動入力しました'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{fileName}</p>
            <p className="text-xs text-green-600 mt-2">別のファイルに変更する場合はタップ</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
            <p className="text-xs text-gray-400 mt-1">タップして再試行</p>
          </>
        )}
      </div>

      {status === 'idle' && mode === 'manual' && (
        <div className="flex items-center gap-1.5 mt-2">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">ファイルを添付して下のフォームに手動で入力してください</p>
        </div>
      )}
    </div>
  )
}
