'use client'

import { useState, useEffect } from 'react'
import { Cliente, ClienteFormData } from '@/types'
import { ClienteFormDados } from './ClienteFormDados'
import { ClienteFormFinanceiro } from './ClienteFormFinanceiro'
import { ClienteFormEscopo } from './ClienteFormEscopo'
import { ClienteFormEquipe } from './ClienteFormEquipe'
import { ClienteFormEstrategia } from './ClienteFormEstrategia'
import { ClienteHistorico } from './ClienteHistorico'
import { authFetch } from '@/lib/api-client'
import { IconX, IconLoader2, IconDeviceFloppy, IconTrash } from '@tabler/icons-react'

interface ClienteModalProps {
  clienteId?: string | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const TABS = [
  { id: 'dados', label: 'Dados' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'escopo', label: 'Escopo' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'estrategia', label: 'Estratégia' },
  { id: 'historico', label: 'Histórico' }
] as const

type TabId = typeof TABS[number]['id']

export function ClienteModal({ clienteId, isOpen, onClose, onSave }: ClienteModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dados')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState<Partial<ClienteFormData>>({
    nome: '',
    email: '',
    telefone: '',
    website: '',
    instagram: '',
    briefing: '',
    escopo: '',
    status: 'ativo',
    mrr: undefined,
    diaVencimento: undefined,
    participaReguaCobranca: false,
    servicosIds: [],
    objetivosIds: [],
    equipeIds: [],
    canais: []
  })

  const isEditing = !!clienteId

  useEffect(() => {
    if (isOpen && clienteId) {
      loadCliente()
    } else if (isOpen) {
      resetForm()
    }
  }, [isOpen, clienteId])

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      website: '',
      instagram: '',
      briefing: '',
      escopo: '',
      status: 'ativo',
      mrr: undefined,
      diaVencimento: undefined,
      participaReguaCobranca: false,
      servicosIds: [],
      objetivosIds: [],
      equipeIds: [],
      canais: []
    })
    setActiveTab('dados')
    setMessage({ type: '', text: '' })
  }

  const loadCliente = async () => {
    setLoading(true)
    try {
      const response = await authFetch(`/api/clientes/${clienteId}`)
      const result = await response.json()
      if (response.ok) {
        const cliente: Cliente = result.cliente
        setFormData({
          nome: cliente.nome,
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          website: cliente.website || '',
          instagram: cliente.instagram || '',
          briefing: cliente.briefing || '',
          escopo: cliente.escopo || '',
          status: cliente.status,
          mrr: cliente.mrr || undefined,
          diaVencimento: cliente.diaVencimento || undefined,
          participaReguaCobranca: cliente.participaReguaCobranca,
          servicosIds: cliente.servicos?.map(s => s.id) || [],
          objetivosIds: cliente.objetivos?.map(o => o.id) || [],
          equipeIds: cliente.equipe?.map(u => u.id) || [],
          canais: cliente.canais || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar cliente' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.nome) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const url = isEditing ? `/api/clientes/${clienteId}` : '/api/clientes'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso!` })
        setTimeout(() => {
          onSave()
          onClose()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao salvar cliente' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar cliente' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!clienteId) return

    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await authFetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const result = await response.json()
        setMessage({ type: 'error', text: result.error || 'Erro ao excluir cliente' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir cliente' })
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="glass-card p-6 rounded-2xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-white">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h4>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-nexum-primary text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
            </div>
          ) : (
            <>
              {activeTab === 'dados' && (
                <ClienteFormDados
                  data={formData}
                  onChange={setFormData}
                />
              )}
              {activeTab === 'financeiro' && (
                <ClienteFormFinanceiro
                  data={formData}
                  onChange={setFormData}
                />
              )}
              {activeTab === 'escopo' && (
                <ClienteFormEscopo
                  data={formData}
                  onChange={setFormData}
                />
              )}
              {activeTab === 'equipe' && (
                <ClienteFormEquipe
                  data={formData}
                  onChange={setFormData}
                />
              )}
              {activeTab === 'estrategia' && (
                <ClienteFormEstrategia
                  data={formData}
                  onChange={setFormData}
                />
              )}
              {activeTab === 'historico' && clienteId && (
                <ClienteHistorico clienteId={clienteId} />
              )}
              {activeTab === 'historico' && !clienteId && (
                <div className="text-center py-8 text-white/40">
                  Histórico disponível após criar o cliente
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <IconLoader2 className="animate-spin" size={18} />
              ) : (
                <IconTrash size={18} />
              )}
              Excluir
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving || deleting || !formData.nome}
            className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <IconLoader2 className="animate-spin" size={18} />
                Salvando...
              </>
            ) : (
              <>
                <IconDeviceFloppy size={18} />
                {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
