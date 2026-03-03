'use client'

import { useState, useEffect } from 'react'
import { ClienteFormData, Objetivo } from '@/types'
import { MultiSelectCreatable } from './MultiSelectCreatable'
import { CanaisCredenciais } from './CanaisCredenciais'
import { authFetch } from '@/lib/api-client'
import { IconLoader2, IconTarget, IconBrandInstagram } from '@tabler/icons-react'

interface ClienteFormEstrategiaProps {
  data: Partial<ClienteFormData>
  onChange: (data: Partial<ClienteFormData>) => void
  disabled?: boolean
}

export function ClienteFormEstrategia({ data, onChange, disabled = false }: ClienteFormEstrategiaProps) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadObjetivos()
  }, [])

  const loadObjetivos = async () => {
    try {
      const response = await authFetch('/api/objetivos')
      const result = await response.json()
      if (response.ok) {
        setObjetivos(result.objetivos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar objetivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateObjetivo = async (nome: string): Promise<Objetivo | null> => {
    try {
      const response = await authFetch('/api/objetivos', {
        method: 'POST',
        body: JSON.stringify({ nome })
      })
      const result = await response.json()
      if (response.ok) {
        setObjetivos([...objetivos, result.objetivo])
        return result.objetivo
      }
      return null
    } catch (error) {
      console.error('Erro ao criar objetivo:', error)
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
      {/* Objetivos */}
      <div>
        <label className="block text-white/60 text-sm mb-2">
          <div className="flex items-center gap-2">
            <IconTarget size={16} />
            Objetivos Principais
          </div>
        </label>
        <MultiSelectCreatable
          options={objetivos.map(o => ({ id: o.id, nome: o.nome }))}
          selectedIds={data.objetivosIds || []}
          onChange={(objetivosIds) => onChange({ ...data, objetivosIds })}
          onCreateOption={handleCreateObjetivo}
          placeholder="Selecione os objetivos do cliente..."
          disabled={disabled}
        />
        <p className="text-white/40 text-xs mt-1">Selecione ou crie novos objetivos</p>
      </div>

      {/* Canais de Atuação */}
      <div>
        <label className="block text-white/60 text-sm mb-2">
          <div className="flex items-center gap-2">
            <IconBrandInstagram size={16} />
            Canais de Atuação
          </div>
        </label>
        <p className="text-white/40 text-xs mb-3">
          Adicione as credenciais de acesso aos canais do cliente
        </p>
        <CanaisCredenciais
          canais={data.canais || []}
          onChange={(canais) => onChange({ ...data, canais })}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
