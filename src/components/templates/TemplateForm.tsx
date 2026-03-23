'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { MessageCircle, Mail, Phone, FileText } from 'lucide-react'

export const TEMPLATE_CATEGORY = {
  LINE:  { label: 'LINE',   icon: MessageCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  EMAIL: { label: 'メール', icon: Mail,          color: 'text-blue-600 bg-blue-50 border-blue-200' },
  PHONE: { label: '電話',   icon: Phone,         color: 'text-orange-600 bg-orange-50 border-orange-200' },
  OTHER: { label: 'その他', icon: FileText,      color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

interface Props {
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    title?: string
    category?: string
    body?: string
    memo?: string
  }
  backHref: string
}

export function TemplateForm({ action, defaultValues, backHref }: Props) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="card p-6 space-y-5">

        {/* タイトル */}
        <div>
          <label className="form-label">
            テンプレート名 <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            className="form-input"
            placeholder="例: 面談日程確認（候補者へ）"
            defaultValue={defaultValues?.title ?? ''}
          />
        </div>

        {/* カテゴリ */}
        <div>
          <label className="form-label">種別</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            {Object.entries(TEMPLATE_CATEGORY).map(([key, { label, icon: Icon, color }]) => (
              <label
                key={key}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  value={key}
                  defaultChecked={(defaultValues?.category ?? 'OTHER') === key}
                  className="sr-only peer"
                />
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                  peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-400
                  ${color} hover:opacity-80`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 本文 */}
        <div>
          <label className="form-label">
            本文 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="body"
            required
            rows={8}
            className="form-textarea font-mono text-sm"
            placeholder={"例:\nお世話になっております。\n〇〇様との面談日程についてご連絡いたします。\n\n以下の日時はいかがでしょうか。\n・{{日時}}\n\nご確認のほどよろしくお願いいたします。"}
            defaultValue={defaultValues?.body ?? ''}
          />
          <p className="text-xs text-gray-400 mt-1">
            {'{{候補者名}}、{{日時}} などのプレースホルダーを自由に使えます'}
          </p>
        </div>

        {/* メモ */}
        <div>
          <label className="form-label">用途メモ（任意）</label>
          <input
            name="memo"
            className="form-input"
            placeholder="例: 面談前日に送る確認メッセージ"
            defaultValue={defaultValues?.memo ?? ''}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '保存中...' : '保存する'}
        </button>
        <Link href={backHref} className="btn-secondary">キャンセル</Link>
      </div>
    </form>
  )
}
