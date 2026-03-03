# Calendário Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a calendar page at `/calendario` using FullCalendar to display tasks from the system with Month, Week, and Day views.

**Architecture:** Single page component with modal for task details. Uses existing auth/company context from Zustand stores. Tasks are fetched from Supabase and transformed into FullCalendar events.

**Tech Stack:** Next.js 14, FullCalendar 6, Supabase, Zustand, Tailwind CSS

---

## Task 1: Add FullCalendar Styles to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add FullCalendar dark theme styles**

Add the following styles at the end of `src/app/globals.css`:

```css
/* FullCalendar Dark Theme */
.fc {
  --fc-border-color: rgba(255, 255, 255, 0.1);
  --fc-button-bg-color: rgba(255, 255, 255, 0.1);
  --fc-button-border-color: rgba(255, 255, 255, 0.2);
  --fc-button-text-color: rgba(255, 255, 255, 0.8);
  --fc-button-hover-bg-color: rgba(255, 255, 255, 0.15);
  --fc-button-hover-border-color: rgba(255, 255, 255, 0.3);
  --fc-button-active-bg-color: #6366f1;
  --fc-button-active-border-color: #6366f1;
  --fc-today-bg-color: rgba(99, 102, 241, 0.15);
  --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
  --fc-page-bg-color: transparent;
  --fc-highlight-color: rgba(99, 102, 241, 0.2);
}

.fc .fc-toolbar-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.fc .fc-col-header-cell-cushion {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
}

.fc .fc-daygrid-day-number {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

.fc .fc-daygrid-day.fc-day-today {
  background-color: rgba(99, 102, 241, 0.15);
}

.fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
  color: #6366f1;
  font-weight: 600;
}

.fc .fc-button {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.fc .fc-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.fc .fc-button-active,
.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  background-color: #6366f1;
  border-color: #6366f1;
  color: white;
}

.fc .fc-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fc .fc-toolbar-chunk {
  display: flex;
  gap: 0.5rem;
}

.fc .fc-prev-button,
.fc .fc-next-button {
  padding: 0.5rem 0.75rem;
}

.fc-event {
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.75rem;
  border: none !important;
}

.fc-event:hover {
  filter: brightness(1.15);
  transform: scale(1.02);
}

.fc-event .fc-event-main {
  color: white;
  font-weight: 500;
}

.fc .fc-daygrid-event {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fc .fc-timegrid-slot {
  height: 3rem;
}

.fc .fc-timegrid-axis-cushion {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.fc .fc-timegrid-now-indicator-line {
  border-color: #6366f1;
}

.fc .fc-timegrid-now-indicator-arrow {
  border-color: #6366f1;
}

.fc-theme-standard td,
.fc-theme-standard th {
  border-color: rgba(255, 255, 255, 0.1);
}

.fc-theme-standard .fc-scrollgrid {
  border-color: rgba(255, 255, 255, 0.1);
}

.fc .fc-more-link {
  color: #6366f1;
  font-weight: 500;
}

.fc .fc-popover {
  background: rgba(15, 15, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(20px);
}

.fc .fc-popover-header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
}
```

**Step 2: Verify styles are added correctly**

Run: `npm run dev`
Expected: No errors, app starts successfully

---

## Task 2: Create CalendarModal Component

**Files:**
- Create: `src/app/calendario/CalendarModal.tsx`

**Step 1: Create the modal component**

Create file `src/app/calendario/CalendarModal.tsx` with:

```tsx
'use client'

import { X, Clock, CheckCircle2, AlertCircle, Calendar, ChevronRight, AlertTriangle } from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { useRouter } from 'next/navigation'

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}

const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendente',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        Icon: Clock
      }
    case 'in_progress':
      return {
        label: 'Em Andamento',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        Icon: AlertCircle
      }
    case 'completed':
      return {
        label: 'Concluído',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        Icon: CheckCircle2
      }
    default:
      return {
        label: status,
        color: 'text-white/60',
        bg: 'bg-white/5',
        border: 'border-white/10',
        Icon: Clock
      }
  }
}

const getPriorityConfig = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return {
        label: 'Alta',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      }
    case 'medium':
      return {
        label: 'Média',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
      }
    case 'low':
      return {
        label: 'Baixa',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30'
      }
    default:
      return {
        label: priority,
        color: 'text-white/60',
        bg: 'bg-white/5',
        border: 'border-white/10'
      }
  }
}

export default function CalendarModal({ isOpen, onClose, task }: CalendarModalProps) {
  const router = useRouter()

  if (!isOpen || !task) return null

  const statusConfig = getStatusConfig(task.status)
  const priorityConfig = getPriorityConfig(task.prioridade)
  const StatusIcon = statusConfig.Icon

  const handleGoToTask = () => {
    onClose()
    router.push('/atividades')
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Sem data definida'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6 pr-8">
          {task.titulo}
        </h2>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
              <StatusIcon className={statusConfig.color} size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Status</p>
              <p className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
            </div>
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${priorityConfig.bg} ${priorityConfig.border} border`}>
              <AlertTriangle className={priorityConfig.color} size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Prioridade</p>
              <p className={`font-medium ${priorityConfig.color}`}>{priorityConfig.label}</p>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nexum-primary/10 border border-nexum-primary/30">
              <Calendar className="text-nexum-primary" size={20} />
            </div>
            <div>
              <p className="text-white/40 text-sm">Vencimento</p>
              <p className="text-white font-medium capitalize">{formatDate(task.dataVencimento)}</p>
            </div>
          </div>

          {/* Descrição */}
          {task.descricao && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-sm mb-2">Descrição</p>
              <p className="text-white/80 text-sm leading-relaxed">
                {task.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Botão para ir para atividades */}
        <button
          onClick={handleGoToTask}
          className="mt-6 w-full py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Ir para Atividades
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Verify component is created**

Run: `npm run dev`
Expected: No TypeScript errors

---

## Task 3: Create Calendar Page

**Files:**
- Create: `src/app/calendario/page.tsx`

**Step 1: Create the calendar page**

Create file `src/app/calendario/page.tsx` with:

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useCompanyStore } from '@/store'
import { isSuperAdmin, Task, User, Company } from '@/types'
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
    descricao: string | null
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

export default function CalendarioPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, checkSession } = useAuthStore()
  const { companies, currentCompany, setCompany, loadCompanies } = useCompanyStore()

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

  const handleSubmenuClick = (path: string) => {
    router.push(path)
  }

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
        <aside className="fixed left-0 top-0 h-full w-64 glass-card m-4 rounded-2xl flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold gradient-text">Nexum</h1>
            {currentCompany && (
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
                    <span className="font-medium flex-1 text-left">{menu.label}</span>
                    {menu.hasSubmenu && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${configSubmenuOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {menu.hasSubmenu && configSubmenuOpen && menu.submenus && (
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
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 ml-72">
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
              </div>
            </div>
          </header>

          <main className="p-4 space-y-4">
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
```

**Step 2: Verify page is created without errors**

Run: `npm run dev`
Expected: No TypeScript errors, app compiles successfully

---

## Task 4: Update Sidebar Navigation in Atividades Page

**Files:**
- Modify: `src/app/atividades/page.tsx`

**Step 1: Update the handleMenuClick function**

Locate the `handleMenuClick` function in `src/app/atividades/page.tsx` (around line 388-397) and update it to:

```typescript
const handleMenuClick = (menuId: string) => {
  if (menuId === 'atividades') {
    setActiveMenu(menuId)
  } else if (menuId === 'calendario') {
    router.push('/calendario')
  } else if (menuId === 'configuracao') {
    setConfigSubmenuOpen(!configSubmenuOpen)
  } else {
    setShowDevToast(true)
    setTimeout(() => setShowDevToast(false), 3000)
  }
}
```

**Step 2: Verify navigation works**

Run: `npm run dev`
- Navigate to `/atividades`
- Click on "Calendário" in sidebar
- Expected: Navigates to `/calendario` page

---

## Task 5: Verify Full Functionality

**Step 1: Test the complete flow**

Run: `npm run dev`

Test checklist:
1. [ ] Navigate to `/atividades`
2. [ ] Click "Calendário" in sidebar - should navigate to `/calendario`
3. [ ] Verify calendar loads with tasks that have `data_vencimento`
4. [ ] Click on Month/Week/Day buttons - should switch views
5. [ ] Click on prev/next buttons - should navigate periods
6. [ ] Click "Hoje" button - should go to current date
7. [ ] Click on an event - should open modal with task details
8. [ ] Click "Ir para Atividades" in modal - should navigate to `/atividades`
9. [ ] Verify task colors match priority (red=high, yellow=medium, green=low)
10. [ ] If SUPER_ADMIN, test company selector

**Step 2: Build for production**

Run: `npm run build`
Expected: Build completes without errors

---

## Summary

This plan creates a fully functional calendar page with:

1. **FullCalendar integration** with Month, Week, Day views
2. **Task display** from Supabase filtered by company
3. **Priority-colored events** (red/yellow/green)
4. **Modal for task details** with navigation to activities
5. **Dark glass-morphism theme** matching the existing UI
6. **Portuguese localization** for all calendar text
7. **Company filtering** for SUPER_ADMIN users
