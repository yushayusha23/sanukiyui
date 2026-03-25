'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  title: string
  clientName?: string | null
  workStyle?: string | null
  workHours?: string | null
  rateText?: string
  startDate?: string | null
  description?: string | null
  requiredSkills?: string | null
  workConditions?: string | null
}

const WORK_STYLE_LABEL: Record<string, string> = {
  REMOTE: 'フルリモート',
  HYBRID: 'ハイブリッド',
  ONSITE: '出社',
}

export function CopyProjectButton({
  title,
  clientName,
  workStyle,
  workHours,
  rateText,
  startDate,
  description,
  requiredSkills,
  workConditions,
}: Props) {
  const [copied, setCopied] = useState(false)

  function buildText() {
    const lines: string[] = []
    lines.push(`【案件名】${title}`)
    if (clientName) lines.push(`【会社名】${clientName}`)
    if (workStyle) lines.push(`【勤務形態】${WORK_STYLE_LABEL[workStyle] ?? workStyle}`)
    if (workHours) lines.push(`【稼働時間】${workHours}`)
    if (rateText) lines.push(`【単価】${rateText}`)
    if (startDate) lines.push(`【稼働開始日】${startDate}`)
    if (description) {
      lines.push('')
      lines.push('【業務内容】')
      lines.push(description)
    }
    if (requiredSkills) {
      lines.push('')
      lines.push('【必須スキル】')
      lines.push(requiredSkills)
    }
    if (workConditions) {
      lines.push('')
      lines.push('【稼働条件・備考】')
      lines.push(workConditions)
    }
    return lines.join('\n')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // フォールバック
      const el = document.createElement('textarea')
      el.value = buildText()
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`btn-sm flex items-center gap-1.5 transition-all ${
        copied
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'btn-secondary'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          コピー
        </>
      )}
    </button>
  )
}
