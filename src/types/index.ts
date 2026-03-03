export type UserRole = 'SUPER_ADMIN' | 'admin' | 'editor' | 'visualizador'

export type CompanyStatus = 'active' | 'inactive' | 'suspended'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  empresaId?: string | null
  createdAt: Date
  cargo?: string | null
  aprovador?: boolean
  ativo?: boolean
  senhaProvisoria?: boolean
}

export interface Company {
  id: string
  nome: string
  status: CompanyStatus
  createdAt: Date
}

export interface Task {
  id: string
  titulo: string
  descricao?: string | null
  status: TaskStatus
  prioridade: TaskPriority
  empresaId: string
  criadoPor: string
  responsavelId?: string | null
  createdAt: Date
  updatedAt: Date
  dataVencimento?: Date | null
}

export interface Socio {
  id: string
  empresaId: string
  nome: string
  porcentagem: number
  criadoEm: Date
  atualizadoEm: Date
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  checkSession: () => Promise<void>
}

export interface CompanyState {
  companies: Company[]
  currentCompany: Company | null
  isLoading: boolean
  createCompany: (nome: string) => Promise<Company | null>
  setCompany: (company: Company) => void
  loadCompanies: () => Promise<void>
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>
}

export const isSuperAdmin = (role: UserRole): boolean => role === 'SUPER_ADMIN'

export const canCreateEdit = (role: UserRole): boolean => 
  role === 'SUPER_ADMIN' || role === 'admin' || role === 'editor'

export const isReadOnly = (role: UserRole): boolean => role === 'visualizador'

export const getRedirectPath = (role: UserRole): string =>
  role === 'SUPER_ADMIN' ? '/superadmin' : '/atividades'

// ============================================
// CLIENTES
// ============================================

export type ClienteStatus = 'ativo' | 'pausado' | 'cancelado'

export type TipoCanal = 'facebook' | 'instagram' | 'google' | 'meta_ads' | 'tiktok' | 'linkedin' | 'youtube'

export interface ClienteCanal {
  canal: TipoCanal
  usuario: string
  senha: string
  observacoes?: string
}

export interface Cliente {
  id: string
  empresaId: string
  nome: string
  email?: string | null
  telefone?: string | null
  website?: string | null
  instagram?: string | null
  briefing?: string | null
  escopo?: string | null
  status: ClienteStatus
  mrr?: number | null
  diaVencimento?: number | null
  participaReguaCobranca: boolean
  canais: ClienteCanal[]
  servicos?: Servico[]
  objetivos?: Objetivo[]
  equipe?: User[]
  criadoEm: Date
  atualizadoEm: Date
  criadoPor?: string
}

export interface Servico {
  id: string
  empresaId: string
  nome: string
  criadoEm: Date
}

export interface Objetivo {
  id: string
  empresaId: string
  nome: string
  criadoEm: Date
}

export interface ClienteHistoricoStatus {
  id: string
  clienteId: string
  statusAnterior?: ClienteStatus | null
  statusNovo: ClienteStatus
  alteradoPor?: string | null
  alteradoEm: Date
  alteradoPorNome?: string
}

export interface ClienteLog {
  id: string
  clienteId: string
  campo: string
  valorAnterior?: string | null
  valorNovo?: string | null
  alteradoPor?: string | null
  alteradoEm: Date
  alteradoPorNome?: string
}

export interface ClienteFormData {
  nome: string
  email?: string
  telefone?: string
  website?: string
  instagram?: string
  briefing?: string
  escopo?: string
  status: ClienteStatus
  mrr?: number
  diaVencimento?: number
  participaReguaCobranca: boolean
  servicosIds: string[]
  objetivosIds: string[]
  equipeIds: string[]
  canais: ClienteCanal[]
}

export const TIPOS_CANAL: { value: TipoCanal; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
]

export const STATUS_CLIENTE: { value: ClienteStatus; label: string; color: string }[] = [
  { value: 'ativo', label: 'Ativo', color: 'green' },
  { value: 'pausado', label: 'Pausado', color: 'yellow' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' },
]
