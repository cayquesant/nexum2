'use client'

import { useEffect, useState, ReactNode, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, useCompanyStore, useLayoutStore, LayoutMode } from '@/store'
import { isSuperAdmin } from '@/types'
import { LogOut, ChevronDown, Loader2, Building2, ArrowLeft, Bell, Settings, User as UserIcon, LayoutGrid, Monitor, Focus, ChevronRight } from 'lucide-react'
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

type MenuId = 'atividades' | 'organizador' | 'relatorios' | 'financeiro' | 'configuracao'

interface DashboardLayoutProps {
  children: ReactNode
  activeMenu: MenuId
}

const layoutOptions: { value: LayoutMode; label: string; icon: typeof Monitor; description: string }[] = [
  { value: 'default', label: 'Padrão', icon: Monitor, description: 'Sidebar e header visíveis' },
  { value: 'compact', label: 'Compacto', icon: LayoutGrid, description: 'Sidebar recolhida' },
  { value: 'focus', label: 'Foco', icon: Focus, description: 'Tela cheia' },
]

export default function DashboardLayout({
  children,
  // activeMenu: Mantido para compatibilidade com páginas existentes, não é mais usado internamente
  // pois o menu é controlado pelo currentPath para shallow routing
}: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated, checkSession } = useAuthStore()
  const { companies, currentCompany, setCompany, loadCompanies } = useCompanyStore()
  const { layoutMode, setLayoutMode } = useLayoutStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [configSubmenuOpen, setConfigSubmenuOpen] = useState(false)
  const [financeiroSubmenuOpen, setFinanceiroSubmenuOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userIsSuperAdmin = user ? isSuperAdmin(user.role) : false

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
    if (!isCheckingAuth && isAuthenticated) {
      loadCompanies()
    }
  }, [isCheckingAuth, isAuthenticated, loadCompanies])

  // Detectar mudanças de rota para shallow routing
  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  // Auto-open submenu based on pathname
  useEffect(() => {
    const isConfigPath = pathname.startsWith('/configuracao/')
    const isFinanceiroPath = pathname.startsWith('/financeiro/')
    setConfigSubmenuOpen(isConfigPath)
    setFinanceiroSubmenuOpen(isFinanceiroPath)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleMenuClick = (menuId: string) => {
    if (menuId === 'atividades') {
      router.push('/atividades')
    } else if (menuId === 'configuracao') {
      setConfigSubmenuOpen(!configSubmenuOpen)
    } else if (menuId === 'financeiro') {
      setFinanceiroSubmenuOpen(!financeiroSubmenuOpen)
    }
  }

  const handleSubmenuClick = (submenuPath: string) => {
    const isConfigOrFinanceiroPath =
      submenuPath.startsWith('/configuracao/') ||
      submenuPath.startsWith('/financeiro/')

    if (isConfigOrFinanceiroPath) {
      // Navegação com push para manter histórico do navegador
      router.push(submenuPath)
    } else {
      // Navegação normal para outras rotas
      router.push(submenuPath)
    }
  }

  // Robust path matching logic for menu highlighting
  const isMenuActive = (menuId: string, path: string) => {
    return path === `/${menuId}` || path.startsWith(`/${menuId}/`)
  }

  const sidebarMenus = [
    { id: 'atividades', label: 'Atividades', icon: IconChecklist },
    { id: 'organizador', label: 'Organizador', icon: IconFolder },
    { id: 'relatorios', label: 'Relatorios', icon: IconReport },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: IconCoin,
      hasSubmenu: true,
      submenus: [
        { id: 'visao-geral', label: 'Visão Geral', icon: IconBrain, path: '/financeiro/visao-geral' },
        { id: 'lancamentos', label: 'Lançamentos', icon: IconCalendar, path: '/financeiro/lancamentos' },
      ],
    },
    {
      id: 'configuracao',
      label: 'Configuracao',
      icon: IconSettings,
      hasSubmenu: true,
      submenus: [
        { id: 'empresa', label: 'Empresa', icon: IconBuilding, path: '/configuracao/empresa' },
        { id: 'equipe', label: 'Equipe', icon: IconUsers, path: '/configuracao/equipe' },
        { id: 'gestao-clientes', label: 'Gestão Clientes', icon: IconUsersGroup, path: '/configuracao/gestao-clientes' },
        { id: 'ia-automacao', label: 'IA Automação', icon: IconBrain, path: '/configuracao/ia-automacao' },
        { id: 'regras-financeiras', label: 'Regras Financeiras', icon: IconCoin, path: '/configuracao/regras-financeiras' },
      ],
    },
  ]

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
      {/* Background */}
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
                const submenuOpen = menu.id === 'financeiro' ? financeiroSubmenuOpen : menu.id === 'configuracao' ? configSubmenuOpen : false
                return (
                  <div key={menu.id}>
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isMenuActive(menu.id, currentPath)
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
                              className={`transition-transform duration-200 ${submenuOpen ? 'rotate-180' : ''}`}
                            />
                          )}
                        </>
                      )}
                    </button>

                    {!sidebarCollapsed && menu.hasSubmenu && submenuOpen && menu.submenus && (
                      <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                        {menu.submenus.map((submenu) => {
                          const SubIcon = submenu.icon
                          const isActive = currentPath === submenu.path
                          return (
                            <button
                              key={submenu.id}
                              onClick={() => handleSubmenuClick(submenu.path)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                                isActive
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

        {/* Main Content Area */}
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

          {/* Page Content */}
          <main className={`p-4 space-y-4 ${!showHeader ? 'pt-4' : ''}`}>
            {children}
          </main>
        </div>
      </div>

      {/* Company Selector Modal */}
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
                ×
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
                <p className="text-white/40 text-center py-4">Nenhuma empresa encontrada</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
