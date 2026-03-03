'use client'

import { useState } from 'react'
import { IconPlus, IconX, IconEye, IconEyeOff, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { ClienteCanal, TIPOS_CANAL, TipoCanal } from '@/types'

interface CanaisCredenciaisProps {
  canais: ClienteCanal[]
  onChange: (canais: ClienteCanal[]) => void
  disabled?: boolean
}

export function CanaisCredenciais({ canais, onChange, disabled = false }: CanaisCredenciaisProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [expandedCanal, setExpandedCanal] = useState<string | null>(null)

  const canaisDisponiveis = TIPOS_CANAL.filter(
    tipo => !canais.some(c => c.canal === tipo.value)
  )

  const addCanal = (tipoCanal: TipoCanal) => {
    const novoCanal: ClienteCanal = {
      canal: tipoCanal,
      usuario: '',
      senha: '',
      observacoes: ''
    }
    onChange([...canais, novoCanal])
    setExpandedCanal(tipoCanal)
  }

  const removeCanal = (tipoCanal: TipoCanal) => {
    onChange(canais.filter(c => c.canal !== tipoCanal))
  }

  const updateCanal = (tipoCanal: TipoCanal, field: keyof ClienteCanal, value: string) => {
    onChange(canais.map(c =>
      c.canal === tipoCanal ? { ...c, [field]: value } : c
    ))
  }

  const togglePassword = (canal: string) => {
    setShowPasswords(prev => ({ ...prev, [canal]: !prev[canal] }))
  }

  const toggleExpand = (canal: string) => {
    setExpandedCanal(expandedCanal === canal ? null : canal)
  }

  const getCanalLabel = (value: TipoCanal) => {
    return TIPOS_CANAL.find(t => t.value === value)?.label || value
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        {canais.map((canal) => (
          <div key={canal.canal} className="bg-white/5 rounded-lg p-3 text-white/60">
            {getCanalLabel(canal.canal)}
          </div>
        ))}
        {canais.length === 0 && (
          <p className="text-white/40 text-sm">Nenhum canal configurado</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Canais já adicionados */}
      {canais.map((canal) => (
        <div key={canal.canal} className="bg-white/5 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleExpand(canal.canal)}
            className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{getCanalLabel(canal.canal)}</span>
            <div className="flex items-center gap-2">
              {expandedCanal === canal.canal ? (
                <IconChevronUp size={18} className="text-white/40" />
              ) : (
                <IconChevronDown size={18} className="text-white/40" />
              )}
            </div>
          </button>

          {expandedCanal === canal.canal && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/5">
              <div>
                <label className="block text-white/60 text-sm mb-1">Usuário</label>
                <input
                  type="text"
                  value={canal.usuario}
                  onChange={(e) => updateCanal(canal.canal, 'usuario', e.target.value)}
                  placeholder="Email ou nome de usuário"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-nexum-primary"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords[canal.canal] ? 'text' : 'password'}
                    value={canal.senha}
                    onChange={(e) => updateCanal(canal.canal, 'senha', e.target.value)}
                    placeholder="Senha"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-nexum-primary"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword(canal.canal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPasswords[canal.canal] ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Observações</label>
                <textarea
                  value={canal.observacoes || ''}
                  onChange={(e) => updateCanal(canal.canal, 'observacoes', e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-nexum-primary resize-none"
                />
              </div>

              <button
                type="button"
                onClick={() => removeCanal(canal.canal)}
                className="text-red-400 text-sm hover:text-red-300 flex items-center gap-1"
              >
                <IconX size={14} />
                Remover canal
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Adicionar novos canais */}
      {canaisDisponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {canaisDisponiveis.map((tipo) => (
            <button
              key={tipo.value}
              type="button"
              onClick={() => addCanal(tipo.value)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-sm transition-colors"
            >
              <IconPlus size={14} />
              {tipo.label}
            </button>
          ))}
        </div>
      )}

      {canais.length === 0 && canaisDisponiveis.length === 0 && (
        <p className="text-white/40 text-sm">Todos os canais foram adicionados</p>
      )}
    </div>
  )
}
