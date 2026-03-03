'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useCompanyStore } from '@/store'
import { isSuperAdmin } from '@/types'
import { createClient } from '@/lib/supabase/browser'
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  Plus,
  LogOut,
  ChevronRight,
  Settings,
  Bell,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'

interface KPIData {
  totalUsuarios: number
  empresasAtivas: number
  mrrTotal: number
  systemStatus: 'online' | 'degraded' | 'offline'
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, checkSession } = useAuthStore()
  const { companies, isLoading, createCompany, loadCompanies, setCompany } = useCompanyStore()
  
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [kpis, setKpis] = useState<KPIData>({
    totalUsuarios: 0,
    empresasAtivas: 0,
    mrrTotal: 0,
    systemStatus: 'online',
  })
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkSession()
      setIsCheckingAuth(false)
    }
    verifyAuth()
  }, [checkSession])

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      if (user && !isSuperAdmin(user.role)) {
        router.replace('/atividades')
        return
      }

      loadCompanies()
      loadKPIs()
    }
  }, [isCheckingAuth, isAuthenticated, user, router, loadCompanies])

  const loadKPIs = async () => {
    setLoadingKpis(true)
    try {
      const supabase = createClient()

      const { count: totalUsuarios } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })

      const { count: empresasAtivas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setKpis({
        totalUsuarios: totalUsuarios || 0,
        empresasAtivas: empresasAtivas || 0,
        mrrTotal: 0,
        systemStatus: 'online',
      })
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error)
    } finally {
      setLoadingKpis(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return
    
    setCreatingCompany(true)
    await createCompany(newCompanyName.trim())
    setNewCompanyName('')
    setCreatingCompany(false)
    loadKPIs()
  }

  const handleAccessCompany = (company: typeof companies[0]) => {
    setCompany(company)
    router.push('/atividades')
  }

  const filteredCompanies = companies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusShortId = (id: string) => {
    return id.substring(0, 8).toUpperCase()
  }

  if (isCheckingAuth || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <Loader2 className="animate-spin text-nexum-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nexum-darker">
      <header className="bg-nexum-dark/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text">Nexum</h1>
              <span className="px-3 py-1 bg-nexum-primary/20 text-nexum-primary text-xs font-medium rounded-full">
                SUPER ADMIN
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <Bell size={20} />
              </button>
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <Settings size={20} />
              </button>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">{user.name}</p>
                  <p className="text-white/40 text-xs">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-nexum-primary/20 via-nexum-secondary/20 to-nexum-primary/20 p-8 border border-nexum-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-nexum-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-2">
              Olá, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-white/60 text-lg">
              Gerencie empresas e monitore o ecossistema Nexum.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="dark-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-1">Total de Usuários</p>
            <p className="text-3xl font-bold text-white">
              {loadingKpis ? <Loader2 className="animate-spin inline" size={24} /> : kpis.totalUsuarios}
            </p>
          </div>

          <div className="dark-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="text-green-400" size={24} />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-1">Empresas Ativas</p>
            <p className="text-3xl font-bold text-white">
              {loadingKpis ? <Loader2 className="animate-spin inline" size={24} /> : kpis.empresasAtivas}
            </p>
          </div>

          <div className="dark-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="text-yellow-400" size={24} />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-1">Receita Total (MRR)</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(kpis.mrrTotal)}</p>
          </div>

          <div className="dark-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Activity className="text-emerald-400" size={24} />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-1">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                kpis.systemStatus === 'online' ? 'bg-green-400' :
                kpis.systemStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <p className="text-2xl font-bold text-white">
                {kpis.systemStatus === 'online' ? 'Online' :
                 kpis.systemStatus === 'degraded' ? 'Degradado' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="dark-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus size={20} className="text-nexum-primary" />
                Nova Empresa
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da empresa"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all"
                />
                <button
                  onClick={handleCreateCompany}
                  disabled={creatingCompany || !newCompanyName.trim()}
                  className="w-full bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCompany ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Building2 size={20} />
                      Criar Empresa
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="dark-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all">
                  <span className="flex items-center gap-3">
                    <Users size={18} />
                    Gerenciar Usuários
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all">
                  <span className="flex items-center gap-3">
                    <Settings size={18} />
                    Configurações
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all">
                  <span className="flex items-center gap-3">
                    <Activity size={18} />
                    Logs do Sistema
                  </span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="dark-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-nexum-primary" />
                  Empresas Cadastradas
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary transition-all w-48"
                    />
                  </div>
                  <button
                    onClick={() => { loadCompanies(); loadKPIs(); }}
                    disabled={isLoading}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-nexum-primary" size={32} />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="text-white/20 mx-auto mb-4" size={48} />
                  <p className="text-white/40">Nenhuma empresa encontrada</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-2">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-nexum-primary/30 to-nexum-secondary/30 rounded-xl flex items-center justify-center">
                          <Building2 className="text-white/80" size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{company.nome}</h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-white/40">ID: {getStatusShortId(company.id)}</span>
                            <span className={`flex items-center gap-1 ${
                              company.status === 'active' ? 'text-green-400' :
                              company.status === 'inactive' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {company.status === 'active' && <CheckCircle size={12} />}
                              {company.status === 'inactive' && <Clock size={12} />}
                              {company.status === 'suspended' && <XCircle size={12} />}
                              {company.status === 'active' ? 'Ativa' :
                               company.status === 'inactive' ? 'Inativa' : 'Suspensa'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccessCompany(company)}
                          className="flex items-center gap-2 px-4 py-2 bg-nexum-primary/20 hover:bg-nexum-primary/30 text-nexum-primary rounded-lg transition-all"
                        >
                          <ExternalLink size={16} />
                          <span className="hidden sm:inline">Acessar painel</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
