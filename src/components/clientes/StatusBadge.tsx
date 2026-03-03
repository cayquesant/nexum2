'use client'

import { ClienteStatus, STATUS_CLIENTE } from '@/types'

interface StatusBadgeProps {
  status: ClienteStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusInfo = STATUS_CLIENTE.find(s => s.value === status) || STATUS_CLIENTE[0]

  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${colors[statusInfo.color]} ${sizeClasses}`}
    >
      {statusInfo.label}
    </span>
  )
}
