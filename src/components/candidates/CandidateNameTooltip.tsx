'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'

interface Props {
  id: string
  name: string
  desiredHourlyRate?: number | null
  minimumHourlyRate?: number | null
  preferredWorkHours?: string | null
  availableStartDate?: Date | string | null
}

function fmt(rate: number | null | undefined) {
  if (!rate) return '-'
  return `¥${rate.toLocaleString()}/h`
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

export function CandidateNameTooltip({ id, name, desiredHourlyRate, minimumHourlyRate, preferredWorkHours, availableStartDate }: Props) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLSpanElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function handleEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
    setShow(true)
  }

  const tooltip = show && mounted ? createPortal(
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[190px] pointer-events-none"
    >
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">希望単価</span>
          <span className="font-medium text-gray-800">{fmt(desiredHourlyRate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">ミニマム</span>
          <span className="font-medium text-gray-800">{fmt(minimumHourlyRate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">稼働時間</span>
          <span className="font-medium text-gray-800">{preferredWorkHours ?? '-'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">稼働開始日</span>
          <span className="font-medium text-gray-800">{fmtDate(availableStartDate)}</span>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        className="inline-block"
      >
        <Link href={`/candidates/${id}`} className="font-medium text-blue-700 hover:underline">
          {name}
        </Link>
      </span>
      {tooltip}
    </>
  )
}
