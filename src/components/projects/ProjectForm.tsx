'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { PROJECT_STATUS, WORK_STYLE_OPTIONS, WORK_HOURS_OPTIONS } from '@/types'

type Project = {
  id: string
  title: string
  clientName?: string | null
  sourceClientName?: string | null
  description?: string | null
  requiredSkills?: string | null
  workStyle?: string | null
  workHours?: string | null
  desiredRate?: number | null
  minimumRate?: number | null
  workConditions?: string | null
  recruitmentStatus?: string | null
  isYearsRequired?: number | null
  fsYearsRequired?: number | null
  saasYearsRequired?: number | null
  status: string
  clientId?: string | null
}

type ClientOption = { id: string; name: string; codeName: string | null }

interface ProjectFormProps {
  project?: Project
  action: (formData: FormData) => Promise<void>
  backHref: string
  clients?: ClientOption[]
}

export function ProjectForm({ project, action, backHref, clients = [] }: ProjectFormProps) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="card p-6">
        <h3 className="section-title">案件情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">
              案件名 <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={project?.title}
              className="form-input"
              placeholder="SaaS企業 インサイドセールス"
            />
          </div>

          <div>
            <label className="form-label">クライアント名</label>
            <input
              name="clientName"
              defaultValue={project?.clientName ?? ''}
              className="form-input"
              placeholder="株式会社〇〇"
            />
          </div>

          {clients.length > 0 && (
            <div>
              <label className="form-label">クライアント紐づけ</label>
              <select name="clientId" defaultValue={project?.clientId ?? ''} className="form-select">
                <option value="">紐づけなし</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.codeName ? ` (${c.codeName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">人材元クライアント名</label>
            <input
              name="sourceClientName"
              defaultValue={project?.sourceClientName ?? ''}
              className="form-input"
              placeholder="人材紹介会社〇〇"
            />
          </div>

          <div>
            <label className="form-label">ステータス</label>
            <select name="status" defaultValue={project?.status ?? 'RECRUITING'} className="form-select">
              {Object.entries(PROJECT_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">募集状況</label>
            <input
              name="recruitmentStatus"
              defaultValue={project?.recruitmentStatus ?? ''}
              className="form-input"
              placeholder="急募、1名など"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">業務内容</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={project?.description ?? ''}
              className="form-textarea"
              placeholder="業務の詳細を入力..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">必須スキル</label>
            <textarea
              name="requiredSkills"
              rows={2}
              defaultValue={project?.requiredSkills ?? ''}
              className="form-textarea"
              placeholder="Salesforce, SaaS知識, 顧客折衝経験"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title">必要経験年数</h3>
        <p className="text-xs text-gray-500 mb-4">マッチング精度向上のため、必要な経験年数を入力してください</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">IS経験（最低年数）</label>
            <input
              name="isYearsRequired"
              type="number"
              min="0"
              step="0.5"
              defaultValue={project?.isYearsRequired ?? ''}
              className="form-input"
              placeholder="2.0"
            />
          </div>
          <div>
            <label className="form-label">FS経験（最低年数）</label>
            <input
              name="fsYearsRequired"
              type="number"
              min="0"
              step="0.5"
              defaultValue={project?.fsYearsRequired ?? ''}
              className="form-input"
              placeholder="1.0"
            />
          </div>
          <div>
            <label className="form-label">SaaS経験（最低年数）</label>
            <input
              name="saasYearsRequired"
              type="number"
              min="0"
              step="0.5"
              defaultValue={project?.saasYearsRequired ?? ''}
              className="form-input"
              placeholder="1.0"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="section-title">勤務条件</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">勤務形態</label>
            <select name="workStyle" defaultValue={project?.workStyle ?? ''} className="form-select">
              <option value="">選択してください</option>
              {WORK_STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">稼働時間</label>
            <select name="workHours" defaultValue={project?.workHours ?? ''} className="form-select">
              <option value="">選択してください</option>
              {WORK_HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">希望単価（時給）</label>
            <input
              name="desiredRate"
              type="number"
              min="0"
              step="100"
              defaultValue={project?.desiredRate ?? ''}
              className="form-input"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="form-label">最低単価（時給）</label>
            <input
              name="minimumRate"
              type="number"
              min="0"
              step="100"
              defaultValue={project?.minimumRate ?? ''}
              className="form-input"
              placeholder="2000"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">稼働条件・備考</label>
            <textarea
              name="workConditions"
              rows={2}
              defaultValue={project?.workConditions ?? ''}
              className="form-textarea"
              placeholder="週5日 9:00-18:00、PCレンタル可..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '保存中...' : project ? '更新する' : '登録する'}
        </button>
        <Link href={backHref} className="btn-secondary">
          キャンセル
        </Link>
      </div>
    </form>
  )
}
