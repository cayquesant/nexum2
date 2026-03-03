'use client'

import { useState, useEffect } from 'react'
import { ClienteFormData, Servico } from '@/types'
import { MultiSelectCreatable } from './MultiSelectCreatable'
import { authFetch } from '@/lib/api-client'
import { IconLoader2 } from '@tabler/icons-react'

interface ClienteFormEscopoProps {
  data: Partial<ClienteFormData>
  onChange: (data: Partial<ClienteFormData>) => void
  disabled?: boolean
}

export function ClienteFormEscopo({ data, onChange, disabled = false }: ClienteFormEscopoProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServicos()
  }, [])

  const loadServicos = async () => {
    try {
      const response = await authFetch('/api/servicos')
      const result = await response.json()
      if (response.ok) {
        setServicos(result.servicos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateServico = async (nome: string): Promise<Servico | null> => {
    try {
      const response = await authFetch('/api/servicos', {
        method: 'POST',
        body: JSON.stringify({ nome })
      })
      const result = await response.json()
      if (response.ok) {
        setServicos([...servicos, result.servico])
        return result.servico
      }
      return null
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="animate-spin text-nexum-primary" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Serviços Contratados */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Serviços Contratados</label>
        <MultiSelectCreatable
          options={servicos.map(s => ({ id: s.id, nome: s.nome }))}
          selectedIds={data.servicosIds || []}
          onChange={(servicosIds) => onChange({ ...data, servicosIds })}
          onCreateOption={handleCreateServico}
          placeholder="Selecione os serviços contratados..."
          disabled={disabled}
        />
        <p className="text-white/40 text-xs mt-1">Selecione ou crie novos serviços</p>
      </div>

      {/* Escopo Detalhado */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Escopo do Projeto</label>
        <textarea
          value={data.escopo || ''}
          onChange={(e) => onChange({ ...data, escopo: e.target.value })}
          disabled={disabled}
          rows={8}
          className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Descreva detalhadamente o escopo do projeto, entregáveis, prazos, etc..."
        />
      </div>
    </div>
  )
}
