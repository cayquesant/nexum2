'use client'

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconUsersGroup, IconLoader2, IconPlus, IconX } from '@tabler/icons-react'

export function GestaoClientesContent() {
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [clientes, setClientes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [activeSection, setActiveSection] = useState('dados')
  const [clientData, setClientData] = useState({
    nome: '',
    email: '',
    telefone: '',
    website: '',
    instagram: '',
    briefing: '',
    escopo: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany) {
      loadClientes()
    }
  }, [currentCompany])

  const loadClientes = async () => {
    if (!currentCompany) return
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', currentCompany.id)

      if (data) {
        setClientes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveClient = async () => {
    if (!currentCompany || !clientData.nome) return
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { error } = await supabase
        .from('clientes')
        .insert({
          empresa_id: currentCompany.id,
          nome: clientData.nome,
          email: clientData.email || null,
          telefone: clientData.telefone || null,
          website: clientData.website || null,
          instagram: clientData.instagram || null,
          briefing: clientData.briefing || null,
          escopo: clientData.escopo || null
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Cliente cadastrado com sucesso!' })
      setShowClientModal(false)
      setClientData({ nome: '', email: '', telefone: '', website: '', instagram: '', briefing: '', escopo: '' })
      loadClientes()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar cliente' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para gerenciar clientes</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IconUsersGroup size={22} />
            Gestao de Clientes
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os clientes da sua empresa</p>
        </div>
        {canCreateEdit && (
          <button
            onClick={() => setShowClientModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <IconPlus size={18} />
            Novo Cliente
          </button>
        )}
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-nexum-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconUsersGroup size={40} className="text-nexum-primary" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">Nenhum cliente cadastrado</h4>
          <p className="text-white/60 max-w-md mx-auto">
            Comece cadastrando seu primeiro cliente para gerenciar seus projetos e informacoes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer">
              <h4 className="text-white font-semibold mb-2">{cliente.nome}</h4>
              <p className="text-white/40 text-sm">{cliente.email || 'Email nao informado'}</p>
              {cliente.instagram && (
                <p className="text-nexum-primary text-sm mt-2">@{cliente.instagram.replace('@', '')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
          <div className="glass-card p-6 rounded-2xl w-full max-w-2xl mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-white">Cadastrar Cliente</h4>
              <button onClick={() => setShowClientModal(false)} className="p-1 text-white/60 hover:text-white">
                <IconX size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {['dados', 'briefing', 'escopo'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section ? 'bg-nexum-primary text-white' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {section === 'dados' && 'Dados'}
                  {section === 'briefing' && 'Briefing'}
                  {section === 'escopo' && 'Escopo'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {activeSection === 'dados' && (
                <>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Nome do Cliente *</label>
                    <input
                      type="text"
                      value={clientData.nome}
                      onChange={(e) => setClientData({ ...clientData, nome: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Email</label>
                      <input
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Telefone</label>
                      <input
                        type="text"
                        value={clientData.telefone}
                        onChange={(e) => setClientData({ ...clientData, telefone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Website</label>
                      <input
                        type="text"
                        value={clientData.website}
                        onChange={(e) => setClientData({ ...clientData, website: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Instagram</label>
                      <input
                        type="text"
                        value={clientData.instagram}
                        onChange={(e) => setClientData({ ...clientData, instagram: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                        placeholder="@usuario"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'briefing' && (
                <div>
                  <label className="block text-white/60 text-sm mb-2">Briefing do Cliente</label>
                  <textarea
                    value={clientData.briefing}
                    onChange={(e) => setClientData({ ...clientData, briefing: e.target.value })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary resize-none"
                    placeholder="Descreva as informacoes importantes sobre o cliente..."
                  />
                </div>
              )}

              {activeSection === 'escopo' && (
                <div>
                  <label className="block text-white/60 text-sm mb-2">Escopo do Projeto</label>
                  <textarea
                    value={clientData.escopo}
                    onChange={(e) => setClientData({ ...clientData, escopo: e.target.value })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary resize-none"
                    placeholder="Descreva o escopo do projeto..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowClientModal(false)
                  setClientData({ nome: '', email: '', telefone: '', website: '', instagram: '', briefing: '', escopo: '' })
                }}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClient}
                disabled={isSaving || !clientData.nome}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
