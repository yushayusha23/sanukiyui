'use client'

import { useTransition, useRef, useState } from 'react'
import Link from 'next/link'
import { CANDIDATE_STATUS, WORK_STYLE_OPTIONS } from '@/types'
import { SkillSheetUploader } from './SkillSheetUploader'

type SkillDetails = {
  isYears?: number | null
  ifYears?: number | null
  saasYears?: number | null
  otherBpoExperience?: string | null
  tools?: string | null
  strengths?: string | null
  freeSkillNote?: string | null
}

type Candidate = {
  id: string
  name: string
  age?: number | null
  company?: string | null
  address?: string | null
  preferredWorkStyle?: string | null
  desiredHourlyRate?: number | null
  minimumHourlyRate?: number | null
  workHistory?: string | null
  availableStartDate?: Date | null
  confirmedInterviewDate?: Date | null
  status: string
  notes?: string | null
  lineUserId?: string | null
  clientId?: string | null
  skillDetails?: SkillDetails | null
}

type ClientOption = { id: string; name: string; codeName: string | null }

interface CandidateFormProps {
  candidate?: Candidate
  action: (formData: FormData) => Promise<void>
  backHref: string
  clients?: ClientOption[]
}

function toDateInputValue(date?: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

function toDateTimeInputValue(date?: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  // datetime-local input format: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CandidateForm({ candidate, action, backHref, clients = [] }: CandidateFormProps) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // 手動添付ファイルをformDataに追加（createCandidate側で処理）
    if (pendingFile) formData.append('skillSheetFile', pendingFile)
    startTransition(() => action(formData))
  }

  function setField(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name)
    if (el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      el.value = value
    }
  }

  function handleExtracted(data: { name?: string; age?: number | null; address?: string | null; workHistory?: string | null; isYears?: number | null; fsYears?: number | null; saasYears?: number | null; desiredHourlyRate?: number | null; availableStartDate?: string | null; notes?: string | null; preferredWorkStyle?: string | null }) {
    if (data.name) setField('name', String(data.name))
    if (data.age) setField('age', String(data.age))
    if (data.address) setField('address', String(data.address))
    if (data.workHistory) setField('workHistory', String(data.workHistory))
    if (data.isYears != null) setField('isYears', String(data.isYears))
    if (data.fsYears != null) setField('ifYears', String(data.fsYears))
    if (data.saasYears != null) setField('saasYears', String(data.saasYears))
    if (data.desiredHourlyRate) setField('desiredHourlyRate', String(data.desiredHourlyRate))
    if (data.availableStartDate) setField('availableStartDate', String(data.availableStartDate))
    if (data.notes) setField('notes', String(data.notes))
    if (data.preferredWorkStyle) setField('preferredWorkStyle', String(data.preferredWorkStyle))
  }

  const sd = candidate?.skillDetails

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-3xl" suppressHydrationWarning>
      {/* スキルシート自動入力 */}
      {!candidate && (
        <div className="card p-6">
          <h3 className="section-title">🦕 スキルシートから自動入力</h3>
          <SkillSheetUploader onExtracted={handleExtracted} onFileSelected={(f) => setPendingFile(f)} />
        </div>
      )}

      {/* 基本情報 */}
      <div className="card p-6">
        <h3 className="section-title">基本情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={candidate?.name}
              className="form-input"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label className="form-label">年齢</label>
            <input
              name="age"
              type="number"
              min="18"
              max="80"
              defaultValue={candidate?.age ?? ''}
              className="form-input"
              placeholder="30"
            />
          </div>

          <div>
            <label className="form-label">所属会社</label>
            <select name="clientId" defaultValue={candidate?.clientId ?? ''} className="form-select">
              <option value="">未設定</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.codeName ? ` (${c.codeName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">居住地</label>
            <input
              name="address"
              defaultValue={candidate?.address ?? ''}
              className="form-input"
              placeholder="東京都渋谷区"
            />
          </div>

          <div>
            <label className="form-label">ステータス</label>
            <select name="status" defaultValue={candidate?.status ?? 'APPLIED'} className="form-select">
              {Object.entries(CANDIDATE_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">希望勤務形態</label>
            <select name="preferredWorkStyle" defaultValue={candidate?.preferredWorkStyle ?? ''} className="form-select">
              <option value="">選択してください</option>
              {WORK_STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">希望単価（時給）</label>
            <input
              name="desiredHourlyRate"
              type="number"
              min="0"
              step="100"
              defaultValue={candidate?.desiredHourlyRate ?? ''}
              className="form-input"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="form-label">最低希望単価（時給）</label>
            <input
              name="minimumHourlyRate"
              type="number"
              min="0"
              step="100"
              defaultValue={candidate?.minimumHourlyRate ?? ''}
              className="form-input"
              placeholder="2000"
            />
          </div>

          <div>
            <label className="form-label">稼働開始可能日</label>
            <input
              name="availableStartDate"
              type="date"
              defaultValue={toDateInputValue(candidate?.availableStartDate)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">面談確定日時</label>
            <input
              name="confirmedInterviewDate"
              type="datetime-local"
              defaultValue={toDateTimeInputValue(candidate?.confirmedInterviewDate)}
              className="form-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">職歴</label>
            <textarea
              name="workHistory"
              rows={4}
              defaultValue={candidate?.workHistory ?? ''}
              className="form-textarea"
              placeholder="前職: 〇〇会社 カスタマーサポート 3年&#10;現職: フリーランス..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">備考・メモ</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={candidate?.notes ?? ''}
              className="form-textarea"
              placeholder="特記事項など..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#06C755]">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              </span>
              LINE ID
            </label>
            <input
              name="lineUserId"
              defaultValue={candidate?.lineUserId ?? ''}
              className="form-input"
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-400 mt-1">
              友達追加後、候補者が最初にメッセージを送るとサーバーログに LINE ID が表示されます
            </p>
          </div>
        </div>
      </div>

      {/* スキル詳細 */}
      <div className="card p-6">
        <h3 className="section-title">スキル詳細</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="form-label">IS経験年数</label>
            <input
              name="isYears"
              type="number"
              min="0"
              step="0.5"
              defaultValue={sd?.isYears ?? ''}
              className="form-input"
              placeholder="3.0"
            />
          </div>
          <div>
            <label className="form-label">FS経験年数</label>
            <input
              name="ifYears"
              type="number"
              min="0"
              step="0.5"
              defaultValue={sd?.ifYears ?? ''}
              className="form-input"
              placeholder="2.0"
            />
          </div>
          <div>
            <label className="form-label">SaaS経験年数</label>
            <input
              name="saasYears"
              type="number"
              min="0"
              step="0.5"
              defaultValue={sd?.saasYears ?? ''}
              className="form-input"
              placeholder="1.0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">使用ツール</label>
            <input
              name="tools"
              defaultValue={sd?.tools ?? ''}
              className="form-input"
              placeholder="Salesforce, Zendesk, Slack"
            />
          </div>
          <div>
            <label className="form-label">得意領域</label>
            <input
              name="strengths"
              defaultValue={sd?.strengths ?? ''}
              className="form-input"
              placeholder="インサイドセールス, 顧客対応"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">その他BPO関連経験</label>
            <input
              name="otherBpoExperience"
              defaultValue={sd?.otherBpoExperience ?? ''}
              className="form-input"
              placeholder="テレアポ, メール対応, チャットサポート"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">スキル自由記述</label>
            <textarea
              name="freeSkillNote"
              rows={3}
              defaultValue={sd?.freeSkillNote ?? ''}
              className="form-textarea"
              placeholder="詳細なスキルや経験を自由に記述..."
            />
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '保存中...' : candidate ? '更新する' : '登録する'}
        </button>
        <Link href={backHref} className="btn-secondary">
          キャンセル
        </Link>
      </div>
    </form>
  )
}
