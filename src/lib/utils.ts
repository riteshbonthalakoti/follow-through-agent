import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `In ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

export function stateToColor(state: string): string {
  const map: Record<string, string> = {
    waiting:   'text-slate-400',
    due:       'text-yellow-400',
    overdue:   'text-orange-400',
    escalated: 'text-red-400',
    closed:    'text-green-400',
  }
  return map[state] ?? 'text-slate-400'
}
