import { cn } from '@/lib/utils'
import {
  CANDIDATE_STATUS,
  CANDIDATE_STATUS_COLORS,
  PROJECT_STATUS,
  PROJECT_STATUS_COLORS,
  CONTACT_TYPE,
  INTERVIEW_RESULT,
  type CandidateStatusKey,
  type ProjectStatusKey,
  type ContactTypeKey,
} from '@/types'

export function CandidateStatusBadge({ status }: { status: string }) {
  const label = CANDIDATE_STATUS[status as CandidateStatusKey] ?? status
  const color = CANDIDATE_STATUS_COLORS[status as CandidateStatusKey] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', color)}>
      {label}
    </span>
  )
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const label = PROJECT_STATUS[status as ProjectStatusKey] ?? status
  const color = PROJECT_STATUS_COLORS[status as ProjectStatusKey] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', color)}>
      {label}
    </span>
  )
}

export function ContactTypeBadge({ type }: { type: string }) {
  const label = CONTACT_TYPE[type as ContactTypeKey] ?? type
  const colors: Record<string, string> = {
    PHONE: 'bg-blue-100 text-blue-700',
    EMAIL: 'bg-purple-100 text-purple-700',
    LINE: 'bg-green-100 text-green-700',
    SMS: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', colors[type] ?? 'bg-gray-100 text-gray-700')}>
      {label}
    </span>
  )
}

export function InterviewResultBadge({ result }: { result: string | null }) {
  if (!result) return null
  const label = INTERVIEW_RESULT[result as keyof typeof INTERVIEW_RESULT] ?? result
  const colors: Record<string, string> = {
    PASSED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    PENDING: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[result] ?? 'bg-gray-100 text-gray-700')}>
      {label}
    </span>
  )
}

export const ACTION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PROPOSAL_NEEDED:   { label: '提案必要！', color: 'bg-red-100 text-red-700 border border-red-300' },
  WAITING_CANDIDATE: { label: '人材元返信待ち', color: 'bg-amber-100 text-amber-700 border border-amber-300' },
  WAITING_CLIENT:    { label: '案件先返信待ち', color: 'bg-blue-100 text-blue-700 border border-blue-300' },
}

export function ActionStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null
  const s = ACTION_STATUS_MAP[status]
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap', s.color)}>
      {s.label}
    </span>
  )
}

export function WorkStyleBadge({ style }: { style: string | null }) {
  if (!style) return null
  const colors: Record<string, string> = {
    'フルリモート': 'bg-teal-100 text-teal-700',
    '一部出社': 'bg-blue-100 text-blue-700',
    '出社': 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', colors[style] ?? 'bg-gray-100 text-gray-700')}>
      {style}
    </span>
  )
}
