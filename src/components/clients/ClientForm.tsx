'use client'

import { useState } from 'react'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  defaultName?: string
  defaultCodeName?: string
  defaultType?: string
  defaultCaution?: boolean
  defaultCautionNote?: string
  defaultMemo?: string
}

export function ClientForm({
  action,
  defaultName = '',
  defaultCodeName = '',
  defaultType = 'BOTH',
  defaultCaution = false,
  defaultCautionNote = '',
  defaultMemo = '',
}: Props) {
  const [caution, setCaution] = useState(defaultCaution)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="form-label">会社名 <span className="text-red-500">*</span></label>
        <input name="name" required defaultValue={defaultName} className="form-input" placeholder="例: Leotoria株式会社" />
      </div>

      <div>
        <label className="form-label">コードネーム（ポケモン名）</label>
        <input name="codeName" defaultValue={defaultCodeName} className="form-input" placeholder="例: リオル" />
      </div>

      <div>
        <label className="form-label">種別</label>
        <select name="type" defaultValue={defaultType} className="form-select">
          <option value="TALENT">人材元</option>
          <option value="PROJECT">案件元</option>
          <option value="BOTH">両方</option>
        </select>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <input
          type="checkbox"
          id="caution"
          name="caution"
          checked={caution}
          onChange={(e) => setCaution(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-red-600"
        />
        <label htmlFor="caution" className="text-sm font-medium text-red-600 cursor-pointer">
          要注意フラグを立てる
        </label>
      </div>

      {caution && (
        <div>
          <label className="form-label">注意内容</label>
          <textarea
            name="cautionNote"
            defaultValue={defaultCautionNote}
            rows={2}
            className="form-textarea"
            placeholder="例: 単価交渉が厳しい、連絡が遅い など"
          />
        </div>
      )}

      <div>
        <label className="form-label">メモ</label>
        <textarea name="memo" defaultValue={defaultMemo} rows={2} className="form-textarea" placeholder="自由記述" />
      </div>

      <button type="submit" className="btn-primary w-full">保存</button>
    </form>
  )
}
