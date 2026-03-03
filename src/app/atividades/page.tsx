"use client";

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore, useCompanyStore, useLayoutStore, LayoutMode } from '@/store'
import { isSuperAdmin, canCreateEdit, isReadOnly, Task, User, Company } from '@/types'
import { createClient } from '@/lib/supabase/browser'
import {
  Plus,
  Compass,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  LogOut,
  Building2,
  ArrowLeft,
  Bell,
  Settings,
  Loader2,
  X,
  Briefcase,
  AlertCircle,
  User as UserIcon,
  LayoutGrid,
  Monitor,
  Focus,
} from 'lucide-react'
import {
  IconChecklist,
  IconFolder,
  IconReport,
  IconBrain,
  IconCalendar,
  IconCoin,
  IconSettings,
  IconBuilding,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  EmpresaContent,
  RegrasFinanceirasContent,
  GestaoClientesContent,
  IAAutomacaoContent,
  EquipeContent,
} from '@/components/configuracao'

type TaskWithAssignee = Task & {
  assignee?: User | null
}

type TeamMember = User & {
  isOnline: boolean
  hoursToday: number
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const layoutOptions: { value: LayoutMode; label: string; icon: typeof Monitor; description: string }[] = [
  { value: 'default', label: 'Padrão', icon: Monitor, description: 'Sidebar e header visíveis' },
  { value: 'compact', label: 'Compacto', icon: LayoutGrid, description: 'Sidebar recolhida' },
  { value: 'focus', label: 'Foco', icon: Focus, description: 'Tela cheia' },
]

export default function AtividadesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout, isAuthenticated, checkSession } = useAuthStore()
  const { companies, currentCompany, setCompany, loadCompanies } = useCompanyStore()
  const { layoutMode, setLayoutMode } = useLayoutStore()

  const [activeTab, setActiveTab] = useState<'pendencias' | 'passos'>('pendencias')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [creatingTask, setCreatingTask] = useState(false)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState('atividades')
  const [activeConfigView, setActiveConfigView] = useState<string | null>(null)
  const [showDevToast, setShowDevToast] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [configSubmenuOpen, setConfigSubmenuOpen] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const configViewFromUrl = searchParams.get('config')
  const senhaAlterada = searchParams.get('senha_alterada')
  const efficiency = 78

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mostrar toast de senha alterada
  useEffect(() => {
    if (senhaAlterada === 'true') {
      setShowSuccessToast(true)
      // Limpar o param da URL
      const url = new URL(window.location.href)
      url.searchParams.delete('senha_alterada')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [senhaAlterada, router])

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
      loadCompanies()
    }
  }, [isCheckingAuth, isAuthenticated, router, loadCompanies])

  // Sincronizar activeConfigView com a URL
  useEffect(() => {
    if (configViewFromUrl) {
      setActiveConfigView(configViewFromUrl)
      setActiveMenu('configuracao')
      setConfigSubmenuOpen(true)
    } else {
      setActiveConfigView(null)
      setActiveMenu('atividades')
    }
  }, [configViewFromUrl])

  const loadTasks = useCallback(async () => {
    if (!user) return
    
    setLoadingTasks(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('tarefas')
        .select('id, titulo, descricao, status, prioridade, empresa_id, criado_por, responsavel_id, criado_em, atualizado_em, data_vencimento')
        .order('criado_em', { ascending: false })

      if (!isSuperAdmin(user.role) && user.empresaId) {
        query = query.eq('empresa_id', user.empresaId)
      } else if (isSuperAdmin(user.role) && currentCompany) {
        query = query.eq('empresa_id', currentCompany.id)
      }

      const { data, error: tasksError } = await query

      if (tasksError) {
        console.error('Erro ao carregar tarefas:', tasksError)
        setError('Nao foi possivel carregar as tarefas.')
        setTasks([])
        return
      }

      const typedData = data as {
        id: string;
        titulo: string;
        descricao: string | null;
        status: string;
        prioridade: string;
        empresa_id: string;
        criado_por: string;
        responsavel_id: string | null;
        criado_em: string;
        atualizado_em: string;
        data_vencimento: string | null;
      }[]

      const tasksWithAssignee: TaskWithAssignee[] = typedData.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        status: item.status as Task['status'],
        prioridade: item.prioridade as Task['prioridade'],
        empresaId: item.empresa_id,
        criadoPor: item.criado_por,
        responsavelId: item.responsavel_id,
        createdAt: new Date(item.criado_em),
        updatedAt: new Date(item.atualizado_em),
        dataVencimento: item.data_vencimento ? new Date(item.data_vencimento) : null,
      }))

      setTasks(tasksWithAssignee)
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err)
      setError('Erro de conexao ao carregar tarefas.')
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }, [user, currentCompany])

  const loadTeamMembers = useCallback(async () => {
    if (!user) return
    
    setLoadingTeam(true)
    
    try {
      const supabase = createClient()
      
      let query = supabase
        .from('usuarios')
        .select('id, nome, email, role, empresa_id, criado_em')

      if (!isSuperAdmin(user.role) && user.empresaId) {
        query = query.eq('empresa_id', user.empresaId)
      } else if (isSuperAdmin(user.role) && currentCompany) {
        query = query.eq('empresa_id', currentCompany.id)
      }

      const { data, error: teamError } = await query

      if (teamError) {
        console.error('Erro ao carregar equipe:', teamError)
        setTeamMembers([])
        return
      }

      type UserData = {
        id: string
        nome: string
        email: string | null
        role: string
        empresa_id: string | null
        criado_em: string
      }

      const typedData = data as UserData[] | null
      const members: TeamMember[] = (typedData || []).map((item) => ({
        id: item.id,
        email: item.email || '',
        name: item.nome,
        role: item.role as User['role'],
        empresaId: item.empresa_id,
        createdAt: new Date(item.criado_em),
        isOnline: false,
        hoursToday: 0,
      }))

      setTeamMembers(members)
    } catch (err) {
      console.error('Erro ao carregar equipe:', err)
      setTeamMembers([])
    } finally {
      setLoadingTeam(false)
    }
  }, [user, currentCompany])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTasks()
      loadTeamMembers()
    }
  }, [isAuthenticated, user, loadTasks, loadTeamMembers])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !user) return
    
    setCreatingTask(true)
    
    try {
      const supabase = createClient()
      
      const empresaId = isSuperAdmin(user.role) 
        ? currentCompany?.id 
        : user.empresaId

      if (!empresaId) {
        alert('Selecione uma empresa para criar a tarefa.')
        setCreatingTask(false)
        return
      }

      const { error: insertError } = await supabase
        .from('tarefas')
        .insert({
          titulo: newTaskTitle.trim(),
          descricao: newTaskDescription.trim() || null,
          status: 'pending',
          prioridade: 'medium',
          empresa_id: empresaId,
          criado_por: user.id,
        })

      if (insertError) {
        console.error('Erro ao criar tarefa:', insertError)
        alert('Erro ao criar tarefa. Tente novamente.')
        return
      }

      setNewTaskTitle('')
      setNewTaskDescription('')
      setShowNewTaskModal(false)
      loadTasks()
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
      alert('Erro ao criar tarefa. Tente novamente.')
    } finally {
      setCreatingTask(false)
    }
  }

  const userCanEdit = user ? canCreateEdit(user.role) : false
  const userIsReadOnly = user ? isReadOnly(user.role) : false
  const userIsSuperAdmin = user ? isSuperAdmin(user.role) : false

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && 
    t.updatedAt.toDateString() === new Date().toDateString()
  )

  const totalTeamHours = teamMembers.reduce((acc, m) => acc + m.hoursToday, 0)
  const onlineMembers = teamMembers.filter((m) => m.isOnline).length

  const getCalendarDays = () => {
    const now = new Date()
    const year = calendarYear
    const month = calendarMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, isCurrentMonth: false })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        isCurrentMonth: true, 
        isToday: i === now.getDate() && month === now.getMonth() && year === now.getFullYear()
      })
    }
    
    return days
  }

  const calendarDays = getCalendarDays()
  const currentMonth = MONTHS[calendarMonth]

  const yearsOptions = []
  for (let y = 2020; y <= 2030; y++) {
    yearsOptions.push(y)
  }

  const productivityData = tasks.length > 0 ? [
    { name: 'Semana 1', produtividade: Math.min(100, tasks.length * 5), tarefas: Math.floor(tasks.length * 0.25) },
    { name: 'Semana 2', produtividade: Math.min(100, tasks.length * 8), tarefas: Math.floor(tasks.length * 0.5) },
    { name: 'Semana 3', produtividade: Math.min(100, tasks.length * 10), tarefas: Math.floor(tasks.length * 0.75) },
    { name: 'Semana 4', produtividade: Math.min(100, tasks.length * 12), tarefas: tasks.length },
  ] : []

  const sidebarMenus = [
    { id: 'atividades', label: 'Atividades', icon: IconChecklist },
    { id: 'organizador', label: 'Organizador', icon: IconFolder },
    { id: 'relatorios', label: 'Relatorios', icon: IconReport },
    { id: 'ia-agente', label: 'IA Agente', icon: IconBrain },
    { id: 'calendario', label: 'Calendario', icon: IconCalendar },
    { id: 'financeiro', label: 'Financeiro', icon: IconCoin },
    { 
      id: 'configuracao', 
      label: 'Configuracao', 
      icon: IconSettings, 
      hasSubmenu: true,
      submenus: [
        { id: 'empresa', label: 'Empresa', icon: IconBuilding, path: '/configuracao/empresa' },
        { id: 'regras-financeiras', label: 'Regras Financeiras', icon: IconCoin, path: '/configuracao/regras-financeiras' },
        { id: 'gestao-clientes', label: 'Gestao de Clientes', icon: IconUsersGroup, path: '/configuracao/gestao-clientes' },
        { id: 'ia-automacao', label: 'IA & Automacao', icon: IconBrain, path: '/configuracao/ia-automacao' },
        { id: 'equipe', label: 'Equipe', icon: IconUsers, path: '/configuracao/equipe' },
      ]
    },
  ]

  const handleMenuClick = (menuId: string) => {
    if (menuId === 'atividades') {
      router.push('/atividades')
    } else if (menuId === 'calendario') {
      router.push('/calendario')
    } else if (menuId === 'configuracao') {
      setConfigSubmenuOpen(!configSubmenuOpen)
    } else {
      setShowDevToast(true)
      setTimeout(() => setShowDevToast(false), 3000)
    }
  }

  const handleSubmenuClick = (submenuPath: string) => {
    router.push(submenuPath)
  }

  // Layout calculations
  const showSidebar = layoutMode === 'default' || layoutMode === 'compact'
  const showHeader = layoutMode === 'default' || layoutMode === 'compact'
  const sidebarCollapsed = layoutMode === 'compact'

  if (isCheckingAuth || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <Loader2 className="animate-spin text-nexum-primary" size={32} />
      </div>
    )
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
        {/* Sidebar */}
        {showSidebar && (
          <aside className={`fixed left-0 top-0 h-full glass-card m-4 rounded-2xl flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6 border-b border-white/10">
              <h1 className="text-2xl font-bold gradient-text">{sidebarCollapsed ? 'N' : 'Nexum'}</h1>
              {!sidebarCollapsed && currentCompany && (
                <p className="text-white/40 text-xs mt-1 truncate">{currentCompany.nome}</p>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {sidebarMenus.map((menu) => {
                const Icon = menu.icon
                return (
                  <div key={menu.id}>
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeMenu === menu.id
                          ? 'bg-nexum-primary/20 text-white border border-nexum-primary/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={20} stroke={1.5} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium flex-1 text-left">{menu.label}</span>
                          {menu.hasSubmenu && (
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${configSubmenuOpen ? 'rotate-180' : ''}`}
                            />
                          )}
                        </>
                      )}
                    </button>

                    {!sidebarCollapsed && menu.hasSubmenu && configSubmenuOpen && menu.submenus && (
                      <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                        {menu.submenus.map((submenu) => {
                          const SubIcon = submenu.icon
                          return (
                            <button
                              key={submenu.id}
                              onClick={() => handleSubmenuClick(submenu.path)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                                activeConfigView === submenu.id
                                  ? 'text-white bg-white/10'
                                  : 'text-white/50 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <SubIcon size={16} stroke={1.5} />
                              <span>{submenu.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </aside>
        )}

        <div className={`flex-1 transition-all duration-300 ${showSidebar ? (sidebarCollapsed ? 'ml-24' : 'ml-72') : ''}`}>
          {/* Header */}
          {showHeader && (
            <header className="glass-card mx-4 mt-4 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {userIsSuperAdmin && (
                    <button
                      onClick={() => router.push('/superadmin')}
                      className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Voltar ao Admin
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {userIsSuperAdmin && (
                    <button
                      onClick={() => setShowCompanySelector(!showCompanySelector)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-all"
                    >
                      <Building2 size={16} />
                      <span className="hidden md:inline text-sm">
                        {currentCompany?.nome || 'Selecionar empresa'}
                      </span>
                    </button>
                  )}

                  <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
                    <Bell size={20} />
                  </button>

                  <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Settings size={20} />
                  </button>

                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-3 pl-4 border-l border-white/10"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user.name}</p>
                        <p className="text-white/40 text-xs capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
                      </div>
                      <ChevronDown size={16} className={`text-white/60 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-72 glass-card rounded-xl overflow-hidden z-50">
                        {/* User Info */}
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{user.name}</p>
                              <p className="text-white/50 text-sm truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Layout Options */}
                        <div className="p-3 border-b border-white/10">
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-2 px-2">Layout</p>
                          <div className="space-y-1">
                            {layoutOptions.map((option) => {
                              const Icon = option.icon
                              const isActive = layoutMode === option.value
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => setLayoutMode(option.value)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                    isActive
                                      ? 'bg-nexum-primary/20 text-white'
                                      : 'text-white/60 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  <Icon size={18} />
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium">{option.label}</p>
                                    <p className="text-xs text-white/40">{option.description}</p>
                                  </div>
                                  {isActive && (
                                    <div className="w-2 h-2 rounded-full bg-nexum-primary" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <UserIcon size={18} />
                            <span className="text-sm">Meu Perfil</span>
                            <ChevronRight size={14} className="ml-auto text-white/30" />
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Settings size={18} />
                            <span className="text-sm">Configurações</span>
                            <ChevronRight size={14} className="ml-auto text-white/30" />
                          </button>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <LayoutGrid size={18} />
                            <span className="text-sm">Preferências</span>
                            <ChevronRight size={14} className="ml-auto text-white/30" />
                          </button>
                        </div>

                        {/* Logout Button */}
                        <div className="p-2 border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Sair</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>
          )}

        <main className={`p-4 space-y-4 ${!showHeader ? 'pt-4' : ''}`}>
          {/* Renderizar conteudo de configuracao se activeConfigView estiver defin */}
          {activeConfigView ? (
            <>
              {activeConfigView === 'empresa' && <EmpresaContent />}
              {activeConfigView === 'regras-financeiras' && <RegrasFinanceirasContent />}
              {activeConfigView === 'gestao-clientes' && <GestaoClientesContent />}
              {activeConfigView === 'ia-automacao' && <IAAutomacaoContent />}
              {activeConfigView === 'equipe' && <EquipeContent />}
            </>
          ) : (
            <>
              {/* Conteudo padra de atividades */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Ola, {user.name.split(' ')[0]}!
                  </h2>
                  <p className="text-white/60 mt-1">
                    {currentCompany ? `Gerenciando: ${currentCompany.nome}` : 'Acompanhe suas atividades'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                </div>
              </div>

              {error && (
            <div className="glass-card p-4 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <Clock className="text-yellow-400" size={22} />
                <span className="text-white/40 text-sm">{inProgressTasks.length}</span>
              </div>
              <p className="text-white/60 text-sm mb-1">Em Andamento</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{loadingTasks ? '-' : inProgressTasks.length}</p>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="text-green-400" size={22} />
                <span className="text-white/40 text-sm">{completedToday.length}</span>
              </div>
              <p className="text-white/60 text-sm mb-1">Concluidos</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{loadingTasks ? '-' : completedToday.length}</p>
                <span className="text-white/40 text-sm">finalizados hoje</span>
              </div>
            </div>

            <div className="glass-card p-5 col-span-1 md:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="text-nexum-primary" size={22} />
                  <select 
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(Number(e.target.value))}
                    className="bg-nexum-dark border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-nexum-primary"
                  >
                    {MONTHS.map((month, idx) => (
                      <option key={idx} value={idx} className="bg-nexum-dark text-white">{month}</option>
                    ))}
                  </select>
                </div>
                <select 
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                  className="bg-nexum-dark border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-nexum-primary"
                >
                  {yearsOptions.map((year) => (
                    <option key={year} value={year} className="bg-nexum-dark text-white">{year}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS.map((day) => (
                  <span key={day} className="text-white/40 text-xs py-1">{day}</span>
                ))}
                {calendarDays.map((item, idx) => (
                  <div
                    key={idx}
                    className={`py-1.5 text-sm rounded-lg ${
                      item.day === null
                        ? ''
                        : item.isToday
                        ? 'bg-nexum-primary text-white font-semibold'
                        : 'text-white/60 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    {item.day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="text-nexum-primary" size={22} />
                  Produtividade
                </h3>
                <select className="bg-nexum-dark border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-nexum-primary">
                  <option value="month" className="bg-nexum-dark text-white">Este mes</option>
                  <option value="week" className="bg-nexum-dark text-white">Esta semana</option>
                  <option value="year" className="bg-nexum-dark text-white">Este ano</option>
                </select>
              </div>
              
              {loadingTasks ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin text-nexum-primary" size={32} />
                </div>
              ) : productivityData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productivityData}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 15, 35, 0.9)', 
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="produtividade"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorProd)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-white/40">
                  <TrendingUp size={48} className="mb-4 opacity-30" />
                  <p>Nenhuma tarefa cadastrada</p>
                  <p className="text-sm">Crie tarefas para visualizar a produtividade</p>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Proximas</h3>
                <button className="text-nexum-primary text-sm hover:text-nexum-secondary transition-colors flex items-center gap-1">
                  Ver todas
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-nexum-primary" size={24} />
                </div>
              ) : pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        task.prioridade === 'high' ? 'bg-red-400' :
                        task.prioridade === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{task.titulo}</p>
                        <p className="text-white/40 text-xs">
                          {task.dataVencimento 
                            ? new Date(task.dataVencimento).toLocaleDateString('pt-BR')
                            : 'Sem data de vencimento'}
                        </p>
                      </div>
                      <ChevronRight className="text-white/40" size={16} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-white/40">
                  <CheckCircle2 size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma pendencia</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="text-nexum-primary" size={22} />
                Equipe
              </h3>
              <span className="text-white/40 text-sm">
                {onlineMembers} online agora
              </span>
            </div>
            
            {loadingTeam ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-nexum-primary" size={32} />
              </div>
            ) : teamMembers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 bg-white/5 rounded-xl"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-nexum-primary/30 to-nexum-secondary/30 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-nexum-dark ${
                          member.isOnline ? 'bg-green-400' : 'bg-white/40'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{member.name}</p>
                        <p className="text-white/40 text-xs capitalize">{member.role.replace('_', ' ').toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white/60 text-sm">Horas totais hoje</p>
                    <p className="text-2xl font-bold text-white">{totalTeamHours.toFixed(1)}h</p>
                  </div>
                  <div className="w-32 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { value: 20 },
                        { value: 35 },
                        { value: 45 },
                        { value: 40 },
                        { value: 55 },
                        { value: 48 },
                      ]}>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="transparent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <Users size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Nenhum membro na equipe</p>
              </div>
            )}
          </div>
            </>
          )}
        </main>
        </div>
      </div>

      {showCompanySelector && userIsSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Selecionar Empresa</h3>
              <button
                onClick={() => setShowCompanySelector(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setCompany(company)
                      setShowCompanySelector(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      currentCompany?.id === company.id
                        ? 'bg-nexum-primary/20 border border-nexum-primary/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Building2 className="text-nexum-primary" size={20} />
                    <div className="text-left">
                      <p className="text-white font-medium">{company.nome}</p>
                      <p className="text-white/40 text-xs">{company.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-white/40 text-center py-4">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="text-nexum-primary" size={22} />
                Nova Tarefa
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Titulo da tarefa</label>
                <input
                  type="text"
                  placeholder="Digite o titulo..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all"
                />
              </div>
              
              <div>
                <label className="text-white/60 text-sm mb-2 block">Descricao (opcional)</label>
                <textarea
                  placeholder="Digite a descricao..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all resize-none"
                />
              </div>
              
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || creatingTask}
                className="w-full py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingTask ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Criando...
                  </>
                ) : (
                  'Criar Tarefa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDevToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="glass-card px-6 py-4 flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/10">
            <AlertCircle className="text-yellow-400" size={22} />
            <div>
              <p className="text-white font-medium">Em desenvolvimento</p>
              <p className="text-white/60 text-sm">Esta funcionalidade estara disponivel em breve.</p>
            </div>
            <button
              onClick={() => setShowDevToast(false)}
              className="ml-4 p-1 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="glass-card px-6 py-4 flex items-center gap-3 border border-green-500/30 bg-green-500/10">
            <CheckCircle2 className="text-green-400" size={22} />
            <div>
              <p className="text-white font-medium">Senha alterada com sucesso!</p>
              <p className="text-white/60 text-sm">Sua nova senha ja esta ativa.</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="ml-4 p-1 text-white/60 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}