'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  label?: string
}

export function DeleteButton({ label = '削除' }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    if (!confirm('本当に削除しますか？この操作は元に戻せません。')) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending}
      className="btn-danger btn-sm"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {pending ? '削除中...' : label}
    </button>
  )
}
