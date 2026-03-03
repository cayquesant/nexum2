'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore, useCompanyStore, useLayoutStore, LayoutMode } from '@/store'
import { isSuperAdmin, Task, User } from '@/types'
import { createClient } from '@/lib/supabase/browser'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { EventClickArg } from '@fullcalendar/core'
import {
  LogOut,
  Building2,
  ArrowLeft,
  Bell,
  Settings,
  Loader2,
  ChevronDown,
  User as UserIcon,
  LayoutGrid,
  Monitor,
  Focus,
  ChevronRight,
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
import CalendarModal from './CalendarModal'

type TaskWithAssignee = Task & {
  assignee?: User | null
}

interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  backgroundColor: string
  borderColor: string
  extendedProps: {
    status: string
    descricao: string | null | undefined
    prioridade: string
    task: Task
  }
}

const getPriorityColor = (prioridade: string): string => {
  switch (prioridade) {
    case 'high':
      return '#ef4444'
    case 'medium':
      return '#eab308'
    case 'low':
      return '#22c55e'
    default:
      return '#6366f1'
  }
}

const layoutOptions: { value: LayoutMode; label: string; icon: typeof Monitor; description: string }[] = [
  { value: 'default', label: 'Padrão', icon: Monitor, description: 'Sidebar e header visíveis' },
  { value: 'compact', label: 'Compacto', icon: LayoutGrid, description: 'Sidebar recolhida' },
  { value: 'focus', label: 'Foco', icon: Focus, description: 'Tela cheia' },
]

export default function CalendarioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout, isAuthenticated, checkSession } = useAuthStore()
  const { companies, currentCompany, setCompany, loadCompanies } = useCompanyStore()
  const { layoutMode, setLayoutMode } = useLayoutStore()

  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState('calendario')
  const [configSubmenuOpen, setConfigSubmenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDevToast, setShowDevToast] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const loadTasks = useCallback(async () => {
    if (!user) return

    setLoadingTasks(true)
    setError(null)

    try {
      const supabase = createClient()

      let query = supabase
        .from('tarefas')
        .select('id, titulo, descricao, status, prioridade, empresa_id, criado_por, responsavel_id, criado_em, atualizado_em, data_vencimento')
        .not('data_vencimento', 'is', null)
        .order('data_vencimento', { ascending: true })

      if (!isSuperAdmin(user.role) && user.empresaId) {
        query = query.eq('empresa_id', user.empresaId)
      } else if (isSuperAdmin(user.role) && currentCompany) {
        query = query.eq('empresa_id', currentCompany.id)
      }

      const { data, error: tasksError } = await query

      if (tasksError) {
        console.error('Erro ao carregar tarefas:', tasksError)
        setError('Não foi possível carregar as tarefas.')
        setTasks([])
        return
      }

      const typedData = data as {
        id: string
        titulo: string
        descricao: string | null
        status: string
        prioridade: string
        empresa_id: string
        criado_por: string
        responsavel_id: string | null
        criado_em: string
        atualizado_em: string
        data_vencimento: string | null
      }[]

      const tasksWithDates: TaskWithAssignee[] = typedData.map((item) => ({
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

      setTasks(tasksWithDates)
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err)
      setError('Erro de conexão ao carregar tarefas.')
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }, [user, currentCompany])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTasks()
    }
  }, [isAuthenticated, user, loadTasks])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const userIsSuperAdmin = user ? isSuperAdmin(user.role) : false

  const taskToEvent = (task: Task): CalendarEvent => ({
    id: task.id,
    title: task.titulo,
    start: task.dataVencimento || new Date(),
    backgroundColor: getPriorityColor(task.prioridade),
    borderColor: getPriorityColor(task.prioridade),
    extendedProps: {
      status: task.status,
      descricao: task.descricao,
      prioridade: task.prioridade,
      task: task
    }
  })

  const events: CalendarEvent[] = tasks.map(taskToEvent)

  const handleEventClick = (clickInfo: EventClickArg) => {
    const task = clickInfo.event.extendedProps.task as Task
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedTask(null)
  }

  const sidebarMenus = [
    { id: 'atividades', label: 'Atividades', icon: IconChecklist, path: '/atividades' },
    { id: 'organizador', label: 'Organizador', icon: IconFolder },
    { id: 'relatorios', label: 'Relatórios', icon: IconReport },
    { id: 'ia-agente', label: 'IA Agente', icon: IconBrain },
    { id: 'calendario', label: 'Calendário', icon: IconCalendar },
    { id: 'financeiro', label: 'Financeiro', icon: IconCoin },
    {
      id: 'configuracao',
      label: 'Configuração',
      icon: IconSettings,
      hasSubmenu: true,
      submenus: [
        { id: 'empresa', label: 'Empresa', icon: IconBuilding, path: '/configuracao/empresa' },
        { id: 'regras-financeiras', label: 'Regras Financeiras', icon: IconCoin, path: '/configuracao/regras-financeiras' },
        { id: 'gestao-clientes', label: 'Gestão de Clientes', icon: IconUsersGroup, path: '/configuracao/gestao-clientes' },
        { id: 'ia-automacao', label: 'IA & Automação', icon: IconBrain, path: '/configuracao/ia-automacao' },
        { id: 'equipe', label: 'Equipe', icon: IconUsers, path: '/configuracao/equipe' },
      ]
    },
  ]

  const handleMenuClick = (menuId: string, path?: string) => {
    if (menuId === 'atividades' && path) {
      router.push(path)
    } else if (menuId === 'calendario') {
      setActiveMenu(menuId)
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
                      onClick={() => handleMenuClick(menu.id, 'path' in menu ? menu.path : undefined)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeMenu === menu.id
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
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Calendário</h2>
                <p className="text-white/60 mt-1">
                  {currentCompany ? `Visualizando: ${currentCompany.nome}` : 'Visualize suas tarefas no calendário'}
                </p>
              </div>
            </div>

            {error && (
              <div className="glass-card p-4 border border-red-500/30 flex items-center gap-3">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="glass-card p-6">
              {loadingTasks ? (
                <div className="h-[600px] flex items-center justify-center">
                  <Loader2 className="animate-spin text-nexum-primary" size={32} />
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  locales={[ptBrLocale]}
                  locale="pt-br"
                  events={events}
                  eventClick={handleEventClick}
                  height="auto"
                  contentHeight="auto"
                  expandRows={true}
                  stickyHeaderDates={true}
                  dayMaxEvents={3}
                  moreLinkText={(num) => `+${num} mais`}
                  noEventsText="Nenhuma tarefa encontrada"
                  buttonText={{
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia'
                  }}
                  views={{
                    dayGridMonth: {
                      titleFormat: { year: 'numeric', month: 'long' }
                    },
                    timeGridWeek: {
                      titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
                    },
                    timeGridDay: {
                      titleFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                    }
                  }}
                />
              )}
            </div>

            {/* Legenda */}
            <div className="glass-card p-4">
              <p className="text-white/60 text-sm mb-3">Legenda de Prioridade:</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-white/80 text-sm">Alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span className="text-white/80 text-sm">Média</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-white/80 text-sm">Baixa</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <CalendarModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />

      {/* Company Selector */}
      {showCompanySelector && userIsSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Selecionar Empresa</h3>
              <button
                onClick={() => setShowCompanySelector(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <span className="sr-only">Fechar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentCompany?.id === company.id
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

      {/* Dev Toast */}
      {showDevToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="glass-card px-6 py-4 flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/10">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-white font-medium">Em desenvolvimento</p>
              <p className="text-white/60 text-sm">Esta funcionalidade estará disponível em breve.</p>
            </div>
            <button
              onClick={() => setShowDevToast(false)}
              className="ml-4 p-1 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
