'use client'

import { useState, useEffect } from 'react'
import { ClienteFormData, User } from '@/types'
import { authFetch } from '@/lib/api-client'
import { IconLoader2, IconUser } from '@tabler/icons-react'

interface ClienteFormEquipeProps {
  data: Partial<ClienteFormData>
  onChange: (data: Partial<ClienteFormData>) => void
  disabled?: boolean
}

export function ClienteFormEquipe({ data, onChange, disabled = false }: ClienteFormEquipeProps) {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      const response = await authFetch('/api/admin/usuarios')
      const result = await response.json()
      if (response.ok) {
        setUsuarios(result.usuarios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUsuario = (usuarioId: string) => {
    const currentIds = data.equipeIds || []
    if (currentIds.includes(usuarioId)) {
      onChange({ ...data, equipeIds: currentIds.filter(id => id !== usuarioId) })
    } else {
      onChange({ ...data, equipeIds: [...currentIds, usuarioId] })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="animate-spin text-nexum-primary" size={24} />
      </div>
    )
  }

  const selectedUsuarios = usuarios.filter(u => data.equipeIds?.includes(u.id))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/60 text-sm mb-2">Membros da Equipe Vinculados</label>
        <p className="text-white/40 text-xs mb-4">Selecione os membros que trabalharão com este cliente</p>
      </div>

      {/* Selected members */}
      {selectedUsuarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedUsuarios.map((usuario) => (
            <span
              key={usuario.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-nexum-primary/20 text-nexum-primary rounded-lg text-sm"
            >
              {usuario.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleUsuario(usuario.id)}
                  className="hover:text-white"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* User list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {usuarios.map((usuario) => {
          const isSelected = data.equipeIds?.includes(usuario.id)

          return (
            <button
              key={usuario.id}
              type="button"
              onClick={() => !disabled && toggleUsuario(usuario.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isSelected
                  ? 'bg-nexum-primary/20 border border-nexum-primary/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {usuario.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{usuario.name}</p>
                <p className="text-white/40 text-sm">{usuario.email}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 bg-nexum-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {usuarios.length === 0 && (
        <div className="text-center py-8 text-white/40">
          <IconUser size={32} className="mx-auto mb-2 opacity-50" />
          <p>Nenhum membro na equipe</p>
        </div>
      )}
    </div>
  )
}
