'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore, useCompanyStore } from '@/store'
import { usePermissions, useCompanyContext } from '@/hooks/usePermissions'
import { 
  IconSettings, 
  IconBuilding, 
  IconCoin, 
  IconBrain, 
  IconUsers, 
  IconWorld,
  IconChevronRight,
  IconLoader2, 
  IconLogout, 
  IconBell, 
  IconArrowLeft, 
  IconBuildingStore
} from '@tabler/icons-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const configMenus = [
  { id: 'empresa', label: 'Empresa', icon: IconBuilding, path: '/configuracoes/empresa' },
  { id: 'regras-financeiras', label: 'Regras Financeiras', icon: IconCoin, path: '/configuracoes/regras-financeiras' },
  { id: 'ia-automacao', label: 'IA & Automacao', icon: IconBrain, path: '/configuracoes/ia-automacao' },
  { id: 'equipe', label: 'Equipe', icon: IconUsers, path: '/configuracoes/equipe' },
  { id: 'gestao-online', label: 'Gestao Online', icon: IconWorld, path: '/configuracoes/gestao-online' },
]

export default function ConfiguracoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, checkSession, logout } = useAuthStore()
  const { currentCompany, setCompany, companies, loadCompanies } = useCompanyStore()
  const { isSuperAdmin, canCreateEdit, isReadOnly } = usePermissions()
  const { hasActiveCompany } = useCompanyContext()
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState('empresa')

  useEffect(() => {
    checkSession().then(() => setIsCheckingAuth(false))
  }, [checkSession])

  useEffect(() => {
    if (isSuperAdmin && companies.length === 0) {
      loadCompanies()
    }
  }, [isSuperAdmin, companies.length, loadCompanies])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && configMenus.find(m => m.id === tab)) {
      setActiveSubmenu(tab)
    }
  }, [searchParams])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleSubmenuClick = (menuId: string) => {
    setActiveSubmenu(menuId)
    router.push(`/configuracoes?tab=${menuId}`)
  }

  if (isCheckingAuth || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSubmenu) {
      case 'empresa':
        return <EmpresaContent currentCompany={currentCompany} canEdit={canCreateEdit} />
      case 'regras-financeiras':
        return <RegrasFinanceirasContent currentCompany={currentCompany} canEdit={canCreateEdit} />
      case 'ia-automacao':
        return <IAAutomacaoContent />
      case 'equipe':
        return <EquipeContent currentCompany={currentCompany} canEdit={canCreateEdit} />
      case 'gestao-online':
        return <GestaoOnlineContent currentCompany={currentCompany} canEdit={canCreateEdit} />
      default:
        return <EmpresaContent currentCompany={currentCompany} canEdit={canCreateEdit} />
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-nexum-darker/90 via-nexum-dark/85 to-nexum-primary/20" />

      <div className="relative z-10 flex">
        <aside className="fixed left-0 top-0 h-full w-64 glass-card m-4 rounded-2xl flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold gradient-text">Nexum</h1>
            {currentCompany && (
              <p className="text-white/40 text-xs mt-1 truncate">{currentCompany.nome}</p>
            )}
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => router.push('/atividades')}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <IconArrowLeft size={18} stroke={1.5} />
              <span>Voltar</span>
            </button>
            
            <div className="pt-2 pb-2">
              <p className="text-white/40 text-xs uppercase tracking-wider px-4 mb-2">Configuracoes</p>
            </div>

            {configMenus.map((menu) => {
              const Icon = menu.icon
              return (
                <button
                  key={menu.id}
                  onClick={() => handleSubmenuClick(menu.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSubmenu === menu.id
                      ? 'bg-nexum-primary/20 text-white border border-nexum-primary/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} stroke={1.5} />
                  <span className="font-medium">{menu.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-white/40 text-xs capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <IconLogout size={18} />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 ml-72">
          <header className="glass-card mx-4 mt-4 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <IconSettings className="text-nexum-primary" size={24} />
                <h2 className="text-xl font-semibold text-white">Configuracoes</h2>
              </div>

              <div className="flex items-center gap-4">
                {isSuperAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCompanySelector(!showCompanySelector)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-all"
                    >
                      <IconBuildingStore size={16} />
                      <span className="hidden md:inline text-sm">
                        {currentCompany?.nome || 'Selecionar empresa'}
                      </span>
                    </button>
                    
                    {showCompanySelector && (
                      <div className="absolute right-0 mt-2 w-64 glass-card rounded-xl p-2 z-50">
                        {companies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => {
                              setCompany(company)
                              setShowCompanySelector(false)
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                              currentCompany?.id === company.id
                                ? 'bg-nexum-primary/20 text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {company.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
                  <IconBell size={20} />
                </button>
              </div>
            </div>
          </header>

          <main className="p-4">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}

function EmpresaContent({ currentCompany, canEdit }: { currentCompany: any; canEdit: boolean }) {
  const [formData, setFormData] = useState({
    nome: '',
    nicho: '',
    investimentoMensal: '',
    diaVencimento: '',
    nomeResponsavel: '',
    numeroResponsavel: '',
    email: '',
    status: 'active'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany) {
      loadCompanyData()
    }
  }, [currentCompany])

  const loadCompanyData = async () => {
    if (!currentCompany) return
    setIsLoading(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', currentCompany.id)
        .single()
      
      if (data) {
        setFormData({
          nome: data.nome || '',
          nicho: data.nicho || '',
          investimentoMensal: data.investimento_mensal || '',
          diaVencimento: data.dia_vencimento || '',
          nomeResponsavel: data.nome_responsavel || '',
          numeroResponsavel: data.numero_responsavel || '',
          email: data.email || '',
          status: data.status || 'active'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCompany) return
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('empresas')
        .update({
          nome: formData.nome,
          nicho: formData.nicho,
          investimento_mensal: formData.investimentoMensal ? parseFloat(formData.investimentoMensal) : null,
          dia_vencimento: formData.diaVencimento ? parseInt(formData.diaVencimento) : null,
          nome_responsavel: formData.nomeResponsavel,
          numero_responsavel: formData.numeroResponsavel,
          email: formData.email,
        })
        .eq('id', currentCompany.id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Dados salvos com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar dados' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para configurar</p>
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
            <IconBuilding size={22} />
            Dados da Empresa
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie as informacoes da sua empresa</p>
        </div>
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/60 text-sm mb-2">Nome da Empresa</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Nicho</label>
            <input
              type="text"
              value={formData.nicho}
              onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Investimento Mensal</label>
            <input
              type="number"
              value={formData.investimentoMensal}
              onChange={(e) => setFormData({ ...formData, investimentoMensal: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Dia de Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.diaVencimento}
              onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Nome do Responsavel</label>
            <input
              type="text"
              value={formData.nomeResponsavel}
              onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Numero do Responsavel</label>
            <input
              type="text"
              value={formData.numeroResponsavel}
              onChange={(e) => setFormData({ ...formData, numeroResponsavel: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white/60 text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Status</label>
            <select
              value={formData.status}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            >
              <option value="active" className="bg-nexum-dark">Ativo</option>
              <option value="inactive" className="bg-nexum-dark">Inativo</option>
              <option value="suspended" className="bg-nexum-dark">Suspenso</option>
            </select>
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegrasFinanceirasContent({ currentCompany, canEdit }: { currentCompany: any; canEdit: boolean }) {
  const [socios, setSocios] = useState<{ id: string; nome: string; percentual: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [novoSocio, setNovoSocio] = useState({ nome: '', percentual: '' })

  useEffect(() => {
    if (currentCompany) {
      loadSocios()
    }
  }, [currentCompany])

  const loadSocios = async () => {
    if (!currentCompany) return
    setIsLoading(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('empresa_id', currentCompany.id)
      
      if (data) {
        setSocios(data.map((s: any) => ({
          id: s.id,
          nome: s.nome,
          percentual: s.percentual
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar socios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPercentual = socios.reduce((acc, s) => acc + s.percentual, 0)
  const isValidTotal = Math.abs(totalPercentual - 100) < 0.01

  const handleAddSocio = () => {
    if (!novoSocio.nome || !novoSocio.percentual) return
    
    const percentual = parseFloat(novoSocio.percentual)
    if (isNaN(percentual) || percentual <= 0 || percentual > 100) return
    
    setSocios([...socios, {
      id: `temp-${Date.now()}`,
      nome: novoSocio.nome,
      percentual
    }])
    setNovoSocio({ nome: '', percentual: '' })
  }

  const handleRemoveSocio = (id: string) => {
    setSocios(socios.filter(s => s.id !== id))
  }

  const handleSave = async () => {
    if (!currentCompany || !isValidTotal) return
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      
      await supabase
        .from('socios')
        .delete()
        .eq('empresa_id', currentCompany.id)
      
      for (const socio of socios) {
        await supabase
          .from('socios')
          .insert({
            empresa_id: currentCompany.id,
            nome: socio.nome,
            percentual: socio.percentual
          })
      }
      
      setMessage({ type: 'success', text: 'Regras financeiras salvas com sucesso!' })
      loadSocios()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para configurar</p>
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
      <div>
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IconCoin size={22} />
          Regras Financeiras
        </h3>
        <p className="text-white/60 text-sm mt-1">Configure a divisao de percentuais entre socios</p>
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="space-y-4">
          {socios.map((socio) => (
            <div key={socio.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="flex-1">
                <p className="text-white font-medium">{socio.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-nexum-primary font-semibold">{socio.percentual}%</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleRemoveSocio(socio.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <span className="text-sm">Remover</span>
                </button>
              )}
            </div>
          ))}

          {socios.length === 0 && (
            <p className="text-white/40 text-center py-8">Nenhum socio cadastrado</p>
          )}
        </div>

        <div className={`mt-4 p-4 rounded-xl ${isValidTotal ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Total:</span>
            <span className={`font-bold text-lg ${isValidTotal ? 'text-green-400' : 'text-red-400'}`}>
              {totalPercentual.toFixed(1)}%
            </span>
          </div>
          {!isValidTotal && (
            <p className="text-red-400 text-sm mt-2">A soma deve ser igual a 100%</p>
          )}
        </div>

        {canEdit && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white font-medium mb-4">Adicionar Socio</p>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Nome do socio"
                value={novoSocio.nome}
                onChange={(e) => setNovoSocio({ ...novoSocio, nome: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              />
              <input
                type="number"
                placeholder="%"
                min="0"
                max="100"
                value={novoSocio.percentual}
                onChange={(e) => setNovoSocio({ ...novoSocio, percentual: e.target.value })}
                className="w-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              />
              <button
                onClick={handleAddSocio}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !isValidTotal}
              className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function IAAutomacaoContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IconBrain size={22} />
          IA & Automacao
        </h3>
        <p className="text-white/60 text-sm mt-1">Configuracoes de inteligencia artificial e automacoes</p>
      </div>

      <div className="glass-card p-12 text-center">
        <div className="w-20 h-20 bg-nexum-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <IconBrain size={40} className="text-nexum-primary" />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">Em Desenvolvimento</h4>
        <p className="text-white/60 max-w-md mx-auto">
          Esta funcionalidade esta sendo desenvolvida e estara disponivel em breve. 
          Aguarde novas atualizacoes!
        </p>
      </div>
    </div>
  )
}

function EquipeContent({ currentCompany, canEdit }: { currentCompany: any; canEdit: boolean }) {
  const [membros, setMembros] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', perfil: 'editor', aprovador: false })
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
      
      const { data, error } = await supabase
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
    if (!currentCompany || !inviteData.email) return
    setIsInviting(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('convites')
        .insert({
          empresa_id: currentCompany.id,
          email: inviteData.email,
          perfil: inviteData.perfil,
          aprovador: inviteData.aprovador,
          status: 'pending'
        })
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Convite enviado com sucesso!' })
      setShowInviteModal(false)
      setInviteData({ email: '', perfil: 'editor', aprovador: false })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao enviar convite' })
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
        {canEdit && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Convidar Membro
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
            </div>
          ))}

          {membros.length === 0 && (
            <p className="text-white/40 text-center py-8">Nenhum membro na equipe</p>
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 rounded-2xl w-full max-w-md mx-4">
            <h4 className="text-xl font-semibold text-white mb-4">Convidar Membro</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                  placeholder="email@exemplo.com"
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
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="aprovador"
                  checked={inviteData.aprovador}
                  onChange={(e) => setInviteData({ ...inviteData, aprovador: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-nexum-primary focus:ring-nexum-primary"
                />
                <label htmlFor="aprovador" className="text-white/60 text-sm">
                  Este membro pode aprovar tasks e gestao de clientes
                </label>
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
                disabled={isInviting || !inviteData.email}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isInviting ? 'Enviando...' : 'Enviar Convite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GestaoOnlineContent({ currentCompany, canEdit }: { currentCompany: any; canEdit: boolean }) {
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
    equipe_atribuida: [] as string[],
    escopo: ''
  })

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
      
      const { data, error } = await supabase
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
            <IconWorld size={22} />
            Gestao Online
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os clientes da sua empresa</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowClientModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Novo Cliente
          </button>
        )}
      </div>

      {clientes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-nexum-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconWorld size={40} className="text-nexum-primary" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="glass-card p-6 rounded-2xl w-full max-w-2xl mx-4 my-8">
            <h4 className="text-xl font-semibold text-white mb-6">Cadastrar Cliente</h4>
            
            <div className="flex gap-2 mb-6">
              {['dados', 'briefing', 'equipe', 'escopo'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section
                      ? 'bg-nexum-primary text-white'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {section === 'dados' && 'Dados'}
                  {section === 'briefing' && 'Briefing'}
                  {section === 'equipe' && 'Equipe'}
                  {section === 'escopo' && 'Escopo'}
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              {activeSection === 'dados' && (
                <>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Nome do Cliente</label>
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
                  <label className="block text-white/60 text-sm mb-2">Briefing Estrategico</label>
                  <textarea
                    value={clientData.briefing}
                    onChange={(e) => setClientData({ ...clientData, briefing: e.target.value })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary resize-none"
                    placeholder="Descreva o briefing do cliente..."
                  />
                </div>
              )}

              {activeSection === 'equipe' && (
                <div>
                  <label className="block text-white/60 text-sm mb-2">Atribuicao de Equipe</label>
                  <p className="text-white/40 text-sm">Selecione os membros da equipe para este cliente</p>
                  <div className="mt-4 p-4 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-center">Funcao em desenvolvimento</p>
                  </div>
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
                onClick={() => setShowClientModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!clientData.nome || !currentCompany) return
                  try {
                    const { createClient } = await import('@/lib/supabase/browser')
                    const supabase = createClient()
                    
                    await supabase
                      .from('clientes')
                      .insert({
                        empresa_id: currentCompany.id,
                        nome: clientData.nome,
                        email: clientData.email,
                        telefone: clientData.telefone,
                        website: clientData.website,
                        instagram: clientData.instagram,
                        briefing: clientData.briefing,
                        escopo: clientData.escopo
                      })
                    
                    setShowClientModal(false)
                    setClientData({
                      nome: '', email: '', telefone: '', website: '', instagram: '',
                      briefing: '', equipe_atribuida: [], escopo: ''
                    })
                    loadClientes()
                  } catch (error) {
                    console.error('Erro ao salvar cliente:', error)
                  }
                }}
                disabled={!clientData.nome}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
