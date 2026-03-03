export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          email: string | null
          whatsapp: string | null
          status: 'active' | 'inactive' | 'suspended'
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          email?: string | null
          whatsapp?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          email?: string | null
          whatsapp?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          criado_em?: string
        }
      }
      empresa_configuracoes: {
        Row: {
          id: string
          empresa_id: string
          dia_vencimento: number
          multa_atraso: number
          juros_mensal: number
          desconto_antecipado: number
          dias_tolerancia: number
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          empresa_id: string
          dia_vencimento?: number
          multa_atraso?: number
          juros_mensal?: number
          desconto_antecipado?: number
          dias_tolerancia?: number
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          dia_vencimento?: number
          multa_atraso?: number
          juros_mensal?: number
          desconto_antecipado?: number
          dias_tolerancia?: number
          criado_em?: string
          atualizado_em?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          role: 'SUPER_ADMIN' | 'admin' | 'editor' | 'visualizador'
          empresa_id: string | null
          email?: string | null
          cargo?: string | null
          aprovador: boolean | null
          ativo: boolean | null
          senha_provisoria: boolean | null
          criado_em: string
        }
        Insert: {
          id: string
          nome: string
          role: 'SUPER_ADMIN' | 'admin' | 'editor' | 'visualizador'
          empresa_id?: string | null
          email?: string | null
          cargo?: string | null
          aprovador?: boolean
          ativo?: boolean
          senha_provisoria?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          role?: 'SUPER_ADMIN' | 'admin' | 'editor' | 'visualizador'
          empresa_id?: string | null
          email?: string | null
          cargo?: string | null
          aprovador?: boolean
          ativo?: boolean
          senha_provisoria?: boolean
          criado_em?: string
        }
      }
      tarefas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          status: 'pending' | 'in_progress' | 'completed'
          prioridade: 'low' | 'medium' | 'high'
          empresa_id: string
          criado_por: string
          responsavel_id: string | null
          criado_em: string
          atualizado_em: string
          data_vencimento: string | null
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          prioridade?: 'low' | 'medium' | 'high'
          empresa_id: string
          criado_por: string
          responsavel_id?: string | null
          criado_em?: string
          atualizado_em?: string
          data_vencimento?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          prioridade?: 'low' | 'medium' | 'high'
          empresa_id?: string
          criado_por?: string
          responsavel_id?: string | null
          criado_em?: string
          atualizado_em?: string
          data_vencimento?: string | null
        }
      }
    }
    Views: {
      tarefas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          status: 'pending' | 'in_progress' | 'completed'
          prioridade: 'low' | 'medium' | 'high'
          empresa_id: string
          criado_por: string
          responsavel_id: string | null
          criado_em: string
          atualizado_em: string
          data_vencimento: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Empresa = Database['public']['Tables']['empresas']['Row']
export type EmpresaConfiguracoes = Database['public']['Tables']['empresa_configuracoes']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Tarefa = Database['public']['Tables']['tarefas']['Row']

export type EmpresaInsert = Database['public']['Tables']['empresas']['Insert']
export type EmpresaConfiguracoesInsert = Database['public']['Tables']['empresa_configuracoes']['Insert']
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type TarefaInsert = Database['public']['Tables']['tarefas']['Insert']

export type EmpresaUpdate = Database['public']['Tables']['empresas']['Update']
export type EmpresaConfiguracoesUpdate = Database['public']['Tables']['empresa_configuracoes']['Update']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']
export type TarefaUpdate = Database['public']['Tables']['tarefas']['Update']
