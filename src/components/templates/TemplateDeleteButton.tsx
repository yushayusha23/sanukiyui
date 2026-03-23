'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteTemplate } from '@/lib/actions/templates'

export function TemplateDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('このテンプレートを削除しますか？')) return
    startTransition(() => deleteTemplate(id))
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium text-red-500 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
      title="削除"
    >
      <Trash2 className="w-3.5 h-3.5" />
      削除
    </button>
  )
}
