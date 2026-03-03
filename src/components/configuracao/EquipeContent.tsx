'use client'

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconUsers, IconLoader2, IconPlus, IconX } from '@tabler/icons-react'

export function EquipeContent() {
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [membros, setMembros] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: '',
    perfil: 'editor',
    aprovador: false,
    ativo: true
  })
  const [isInviting, setIsInviting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany) {
      loadMembros()
    }
  }, [currentCompany])

  const loadMembros = async () => {
    if (!currentCompany) return
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', currentCompany.id)

      if (data) {
        setMembros(data)
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!currentCompany || !inviteData.email || !inviteData.nome || !inviteData.senha) return
    setIsInviting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: inviteData.nome,
          email: inviteData.email,
          senha: inviteData.senha,
          cargo: inviteData.cargo,
          perfil: inviteData.perfil,
          aprovador: inviteData.aprovador,
          ativo: inviteData.ativo,
          empresaId: currentCompany.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuario')
      }

      setMessage({ type: 'success', text: 'Usuario criado com sucesso!' })
      setShowInviteModal(false)
      setInviteData({ nome: '', email: '', senha: '', cargo: '', perfil: 'editor', aprovador: false, ativo: true })
      loadMembros()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao criar usuario' })
    } finally {
      setIsInviting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'editor': return 'Editor'
      case 'visualizador': return 'Visualizador'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'text-purple-400 bg-purple-500/20'
      case 'admin': return 'text-blue-400 bg-blue-500/20'
      case 'editor': return 'text-green-400 bg-green-500/20'
      case 'visualizador': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-white/60 bg-white/10'
    }
  }

  const handleToggleStatus = async (membroId: string, currentStatus: boolean) => {
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !currentStatus })
        .eq('id', membroId)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        setMessage({ type: 'error', text: 'Erro ao atualizar status do usuario' })
        return
      }

      setMembros(membros.map(m => m.id === membroId ? { ...m, ativo: !currentStatus } : m))
      setMessage({ type: 'success', text: `Usuario ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!` })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setMessage({ type: 'error', text: 'Erro ao atualizar status do usuario' })
    }
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para gerenciar a equipe</p>
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
            <IconUsers size={22} />
            Equipe
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os membros da sua equipe</p>
        </div>
        {canCreateEdit && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <IconPlus size={18} />
            Adicionar Membro
          </button>
        )}
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="space-y-4">
          {membros.map((membro) => (
            <div key={membro.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold">
                {membro.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{membro.nome}</p>
                {membro.cargo && <p className="text-nexum-primary/80 text-sm">{membro.cargo}</p>}
                <p className="text-white/40 text-sm">{membro.email || 'Email nao cadastrado'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(membro.role)}`}>
                {getRoleLabel(membro.role)}
              </span>
              {membro.aprovador && (
                <span className="px-3 py-1 rounded-full text-xs font-medium text-yellow-400 bg-yellow-500/20">
                  Aprovador
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${membro.ativo ? 'text-green-400' : 'text-red-400'}`}>
                  {membro.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(membro.id, membro.ativo)}
                  disabled={!canCreateEdit}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    membro.ativo ? 'bg-green-500' : 'bg-red-500/50'
                  } ${!canCreateEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={membro.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      membro.ativo ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}

          {membros.length === 0 && (
            <p className="text-white/40 text-center py-8">Nenhum membro na equipe</p>
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-xl font-semibold text-white mb-4">Adicionar Membro</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={inviteData.nome}
                  onChange={(e) => setInviteData({ ...inviteData, nome: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Senha *</label>
                <input
                  type="password"
                  value={inviteData.senha}
                  onChange={(e) => setInviteData({ ...inviteData, senha: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                  placeholder="Senha do usuario"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Cargo</label>
                <input
                  type="text"
                  value={inviteData.cargo}
                  onChange={(e) => setInviteData({ ...inviteData, cargo: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                  placeholder="Ex: Desenvolvedor, Gerente..."
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Perfil</label>
                <select
                  value={inviteData.perfil}
                  onChange={(e) => setInviteData({ ...inviteData, perfil: e.target.value })}
                  className="w-full bg-nexum-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                >
                  <option value="admin" className="bg-nexum-dark">Admin</option>
                  <option value="editor" className="bg-nexum-dark">Editor</option>
                  <option value="visualizador" className="bg-nexum-dark">Visualizador</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">Aprovador</p>
                  <p className="text-white/40 text-xs">Pode aprovar tasks e gestao de clientes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteData({ ...inviteData, aprovador: !inviteData.aprovador })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${inviteData.aprovador ? 'bg-nexum-primary' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${inviteData.aprovador ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">Status</p>
                  <p className="text-white/40 text-xs">Usuario ativo no sistema</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteData({ ...inviteData, ativo: !inviteData.ativo })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${inviteData.ativo ? 'bg-nexum-primary' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${inviteData.ativo ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteData.email || !inviteData.nome || !inviteData.senha}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isInviting ? 'Criando...' : 'Criar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
