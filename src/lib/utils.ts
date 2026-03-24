import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy/MM/dd', { locale: ja })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy/MM/dd HH:mm', { locale: ja })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ja })
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  return isPast(d)
}

export function getDaysOverdue(date: Date | string | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  return differenceInDays(new Date(), d)
}

export function formatRate(rate: number | null | undefined): string {
  if (!rate) return '-'
  return `¥${rate.toLocaleString()}/h`
}

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: '時給',
  daily: '日給',
  monthly: '月収',
}

export function formatRateNew(
  rateType: string | null | undefined,
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
): string {
  if (!rateMin) return '-'
  const prefix = RATE_TYPE_LABEL[rateType ?? 'hourly'] ?? '時給'
  const min = `¥${rateMin.toLocaleString()}`
  const max = rateMax ? `〜¥${rateMax.toLocaleString()}` : ''
  return `${prefix} ${min}${max}`
}

export function formatAge(age: number | null | undefined): string {
  if (!age) return '-'
  return `${age}歳`
}
