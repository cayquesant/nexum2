'use client'

import { Cliente, STATUS_CLIENTE } from '@/types'
import { StatusBadge } from './StatusBadge'
import { IconCurrencyDollar, IconCalendar, IconUsers } from '@tabler/icons-react'

interface ClienteCardProps {
  cliente: Cliente
  onClick: () => void
}

export function ClienteCard({ cliente, onClick }: ClienteCardProps) {
  const statusInfo = STATUS_CLIENTE.find(s => s.value === cliente.status) || STATUS_CLIENTE[0]

  const formatMRR = (mrr?: number | null) => {
    if (!mrr) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(mrr)
  }

  return (
    <div
      onClick={onClick}
      className="glass-card p-6 hover:bg-white/5 transition-all cursor-pointer group border-l-4"
      style={{ borderLeftColor: statusInfo.color === 'green' ? '#22c55e' : statusInfo.color === 'yellow' ? '#eab308' : '#ef4444' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate group-hover:text-nexum-primary transition-colors">
            {cliente.nome}
          </h4>
          {cliente.email && (
            <p className="text-white/40 text-sm truncate">{cliente.email}</p>
          )}
        </div>
        <StatusBadge status={cliente.status} size="sm" />
      </div>

      <div className="flex items-center gap-4 text-sm">
        {cliente.mrr && (
          <div className="flex items-center gap-1 text-white/60">
            <IconCurrencyDollar size={14} />
            <span>{formatMRR(cliente.mrr)}</span>
          </div>
        )}

        {cliente.diaVencimento && (
          <div className="flex items-center gap-1 text-white/60">
            <IconCalendar size={14} />
            <span>Dia {cliente.diaVencimento}</span>
          </div>
        )}

        {cliente.equipe && cliente.equipe.length > 0 && (
          <div className="flex items-center gap-1 text-white/60">
            <IconUsers size={14} />
            <span>{cliente.equipe.length}</span>
          </div>
        )}
      </div>

      {cliente.instagram && (
        <p className="text-nexum-primary text-sm mt-2">
          @{cliente.instagram.replace('@', '')}
        </p>
      )}
    </div>
  )
}
