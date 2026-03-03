'use client'

import { useState, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

interface Socio {
  id?: string
  nome: string
  porcentagem: number
}

interface SocioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (socio: Socio) => Promise<void>
  socio?: Socio | null
  isSaving: boolean
}

export function SocioModal({ isOpen, onClose, onSave, socio, isSaving }: SocioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    porcentagem: 0
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (socio) {
      setFormData({
        nome: socio.nome,
        porcentagem: socio.porcentagem
      })
    } else {
      setFormData({ nome: '', porcentagem: 0 })
    }
    setError('')
  }, [socio, isOpen])

  const handleSubmit = async () => {
    setError('')

    if (formData.nome.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    if (formData.porcentagem < 0 || formData.porcentagem > 100) {
      setError('Porcentagem deve estar entre 0 e 100')
      return
    }

    await onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card p-6 rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-white">
            {socio ? 'Editar Socio' : 'Adicionar Socio'}
          </h4>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <IconX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              placeholder="Nome do socio"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Porcentagem (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.porcentagem}
              onChange={(e) => setFormData({ ...formData, porcentagem: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              placeholder="Ex: 25"
            />
            <p className="text-white/40 text-sm mt-1">Valor entre 0 e 100</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : (socio ? 'Atualizar' : 'Adicionar')}
          </button>
        </div>
      </div>
    </div>
  )
}
