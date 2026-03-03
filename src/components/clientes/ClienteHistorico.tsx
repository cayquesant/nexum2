'use client'

import { useState, useEffect } from 'react'
import { ClienteHistoricoStatus as Historico, STATUS_CLIENTE } from '@/types'
import { authFetch } from '@/lib/api-client'
import { IconLoader2, IconClock, IconUser } from '@tabler/icons-react'

interface ClienteHistoricoProps {
  clienteId: string
}

export function ClienteHistorico({ clienteId }: ClienteHistoricoProps) {
  const [historico, setHistorico] = useState<Historico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistorico()
  }, [clienteId])

  const loadHistorico = async () => {
    try {
      const response = await authFetch(`/api/clientes/${clienteId}/historico`)
      const result = await response.json()
      if (response.ok) {
        setHistorico(result.historico || [])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status: string) => {
    return STATUS_CLIENTE.find(s => s.value === status)?.label || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ativo: 'text-green-400',
      pausado: 'text-yellow-400',
      cancelado: 'text-red-400'
    }
    return colors[status] || 'text-white'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="animate-spin text-nexum-primary" size={24} />
      </div>
    )
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <IconClock size={32} className="mx-auto mb-2 opacity-50" />
        <p>Nenhum registro de alteração de status</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/60 mb-4">
        <IconClock size={18} />
        <span className="text-sm">Histórico de mudanças de status</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />

        {/* Timeline items */}
        <div className="space-y-4">
          {historico.map((item) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 w-8 h-8 bg-nexum-dark rounded-full flex items-center justify-center border-2 border-nexum-primary">
                <div className="w-2 h-2 bg-nexum-primary rounded-full" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.statusAnterior && (
                      <>
                        <span className={`font-medium ${getStatusColor(item.statusAnterior)}`}>
                          {getStatusLabel(item.statusAnterior)}
                        </span>
                        <span className="text-white/40">→</span>
                      </>
                    )}
                    <span className={`font-medium ${getStatusColor(item.statusNovo)}`}>
                      {getStatusLabel(item.statusNovo)}
                    </span>
                  </div>
                  <span className="text-white/40 text-xs">
                    {formatDate(item.alteradoEm)}
                  </span>
                </div>

                {item.alteradoPorNome && (
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <IconUser size={12} />
                    <span>{item.alteradoPorNome}</span>
                  </div>
                )}

                {!item.statusAnterior && (
                  <p className="text-white/40 text-xs">Cliente criado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
