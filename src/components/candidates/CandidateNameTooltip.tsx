'use client'

import { useState } from 'react'
import Link from 'next/link'

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

  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Link href={`/candidates/${id}`} className="font-medium text-blue-700 hover:underline">
        {name}
      </Link>

      {show && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px] pointer-events-none">
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
        </div>
      )}
    </div>
  )
}
