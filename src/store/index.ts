import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/browser'
import { User, Company, AuthState, CompanyState, getRedirectPath, UserRole, CompanyStatus } from '@/types'
import type { Database } from '@/types/database'

type SupabaseClient = ReturnType<typeof createClient>

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: authError.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique seu email e senha.'
            : authError.message,
        })
        return false
      }

      if (!authData.user) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Erro ao autenticar usuário.',
        })
        return false
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (usuarioError || !usuarioData) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Usuário não encontrado no sistema.',
        })
        await supabase.auth.signOut()
        return false
      }

      const user: User = {
        id: usuarioData.id,
        email: authData.user.email || '',
        name: usuarioData.nome,
        role: usuarioData.role as UserRole,
        empresaId: usuarioData.empresa_id,
        createdAt: new Date(usuarioData.criado_em),
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return true
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Erro de conexão. Verifique sua internet e tente novamente.',
      })
      return false
    }
  },

  logout: async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }

    set({
      user: null,
      isAuthenticated: false,
      error: null,
    })
  },

  clearError: () => set({ error: null }),

  checkSession: async () => {
    set({ isLoading: true })

    try {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (usuarioError || !usuarioData) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      const user: User = {
        id: usuarioData.id,
        email: session.user.email || '',
        name: usuarioData.nome,
        role: usuarioData.role as UserRole,
        empresaId: usuarioData.empresa_id,
        createdAt: new Date(usuarioData.criado_em),
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [],
      currentCompany: null,
      isLoading: false,

      createCompany: async (nome: string) => {
    set({ isLoading: true })

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        set({ isLoading: false })
        return null
      }

      const { data, error } = await supabase
        .from('empresas')
        .insert({ nome })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar empresa:', error)
        set({ isLoading: false })
        return null
      }

      const newCompany: Company = {
        id: data.id,
        nome: data.nome,
        status: data.status as CompanyStatus,
        createdAt: new Date(data.criado_em),
      }

      set((state) => ({
        companies: [...state.companies, newCompany],
        isLoading: false,
      }))

      return newCompany
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      set({ isLoading: false })
      return null
    }
  },

  setCompany: (company: Company) => set({ currentCompany: company }),

  loadCompanies: async () => {
    set({ isLoading: true })

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar empresas:', error)
        set({ companies: [], isLoading: false })
        return
      }

      const companies: Company[] = (data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        status: item.status as CompanyStatus,
        createdAt: new Date(item.criado_em),
      }))

      set({ companies, isLoading: false })
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      set({ companies: [], isLoading: false })
    }
  },

  updateCompany: async (id: string, data: Partial<Company>) => {
    set({ isLoading: true })

    try {
      const supabase = createClient()
      const updateData: Record<string, unknown> = {}
      
      if (data.nome !== undefined) updateData.nome = data.nome
      if (data.status !== undefined) updateData.status = data.status

      const { error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Erro ao atualizar empresa:', error)
        set({ isLoading: false })
        return
      }

      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === id ? { ...company, ...data } : company
        ),
        isLoading: false,
      }))
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      set({ isLoading: false })
    }
  },
}),
{
  name: 'nexum-company-storage',
  partialize: (state) => ({
    currentCompany: state.currentCompany,
  }),
}
)
)

// Layout Store
export type LayoutMode = 'default' | 'compact' | 'focus'

interface LayoutState {
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layoutMode: 'default',
      setLayoutMode: (mode: LayoutMode) => set({ layoutMode: mode }),
    }),
    {
      name: 'nexum-layout-storage',
    }
  )
)

export { getRedirectPath }
