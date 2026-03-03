# Modal de Cadastro de Membro - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar modal completo de cadastro de membro com criação direta de usuário, senha provisória e toggle de status.

**Architecture:** API routes para criar/atualizar usuários via SERVICE_ROLE_KEY, página de troca de senha obrigatória, middleware para verificação de senha_provisoria e ativo.

**Tech Stack:** Next.js 14 App Router, Supabase Auth, TypeScript, Tailwind CSS

---

## Task 1: Migration SQL - Adicionar campos na tabela usuarios

**Files:**
- Create: `supabase/05-add-usuario-campos.sql`

**Step 1: Criar arquivo de migration**

```sql
-- =====================================================
-- NEXUM - Migration: Adicionar campos à tabela usuarios
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Adicionar novos campos na tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS aprovador BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS senha_provisoria BOOLEAN DEFAULT TRUE;

-- Criar índices para busca
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_aprovador ON public.usuarios(aprovador);

-- Atualizar RLS para verificar conta ativa
CREATE OR REPLACE FUNCTION is_usuario_ativo()
RETURNS BOOLEAN AS $$
DECLARE
    usuario_ativo BOOLEAN;
BEGIN
    SELECT ativo INTO usuario_ativo
    FROM public.usuarios
    WHERE id = auth.uid();

    RETURN COALESCE(usuario_ativo, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Documentar execução**

Adicionar ao README ou CLAUDE.md que esta migration deve ser executada no Supabase SQL Editor.

---

## Task 2: Atualizar tipos TypeScript

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Adicionar campos ao tipo User**

Atualizar a interface User existente:

```typescript
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
```

---

## Task 3: API Route - Criar usuário

**Files:**
- Create: `src/app/api/admin/usuarios/route.ts`

**Step 1: Criar diretório e arquivo**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, senha, cargo, perfil, aprovador, ativo, empresaId } = body

    // Validações
    if (!nome || !email || !senha || !perfil || !empresaId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, senha, perfil, empresaId' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'visualizador'].includes(perfil)) {
      return NextResponse.json(
        { error: 'Perfil inválido. Use: admin, editor ou visualizador' },
        { status: 400 }
      )
    }

    // Criar cliente admin com service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Criar usuário no auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome,
        role: perfil
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no auth:', authError)
      return NextResponse.json(
        { error: authError.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    // Criar registro na tabela usuarios
    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome,
        email,
        role: perfil,
        cargo: cargo || null,
        aprovador: aprovador || false,
        ativo: ativo !== undefined ? ativo : true,
        senha_provisoria: true,
        empresa_id: empresaId
      })

    if (dbError) {
      // Tentar remover o usuário do auth se falhou no banco
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Erro ao criar registro na tabela usuarios:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Erro ao criar registro de usuário' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        nome,
        role: perfil
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

---

## Task 4: API Route - Atualizar status do usuário

**Files:**
- Create: `src/app/api/admin/usuarios/[id]/route.ts`

**Step 1: Criar diretório e arquivo**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { ativo, aprovador, cargo } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente admin com service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Construir objeto de atualização apenas com campos fornecidos
    const updates: Record<string, unknown> = {}
    if (ativo !== undefined) updates.ativo = ativo
    if (aprovador !== undefined) updates.aprovador = aprovador
    if (cargo !== undefined) updates.cargo = cargo

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Atualizar registro na tabela usuarios
    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar usuário' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

---

## Task 5: Página de alteração de senha

**Files:**
- Create: `src/app/alterar-senha/page.tsx`

**Step 1: Criar página de alteração de senha**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { IconLock, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Atualizar senha no auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Atualizar flag de senha_provisoria
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (userId) {
        await fetch('/api/auth/alterar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      }

      router.push('/atividades')
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexum-dark">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <IconLock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Alterar Senha</h1>
          <p className="text-white/60 mt-2">Defina sua nova senha para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Nova senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary pr-12"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showSenha ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary pr-12"
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showConfirmar ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !senha || !confirmarSenha}
            className="w-full px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="animate-spin" size={20} />
                Alterando...
              </>
            ) : (
              'Confirmar nova senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## Task 6: API Route - Atualizar senha provisória

**Files:**
- Create: `src/app/api/auth/alterar-senha/route.ts`

**Step 1: Criar API route**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente admin com service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Atualizar flag senha_provisoria para false
    const { error } = await supabase
      .from('usuarios')
      .update({ senha_provisoria: false })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao atualizar senha_provisoria:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

---

## Task 7: Atualizar Middleware

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Adicionar verificação de senha_provisoria e ativo**

Ler o arquivo atual e adicionar a lógica de verificação. O middleware deve:
1. Verificar se o usuário está autenticado
2. Se autenticado, buscar dados do usuário na tabela usuarios
3. Se `senha_provisoria = true` e não estiver na página `/alterar-senha`, redirecionar
4. Se `ativo = false`, redirecionar para página de erro ou logout

**Nota:** Como o middleware não pode fazer queries diretas ao banco, precisamos usar uma abordagem diferente:
- Armazenar `senha_provisoria` e `ativo` nos metadados do usuário no auth
- Ou criar uma API route que o middleware consulta

---

## Task 8: Atualizar página de equipe - Modal completo

**Files:**
- Modify: `src/app/configuracao/equipe/page.tsx`

**Step 1: Atualizar estado do formulário**

```typescript
const [inviteData, setInviteData] = useState({
  nome: '',
  email: '',
  senha: '',
  cargo: '',
  perfil: 'editor',
  aprovador: false,
  ativo: true
})
```

**Step 2: Atualizar função handleInvite**

Substituir a função para chamar a nova API:

```typescript
const handleInvite = async () => {
  if (!currentCompany || !inviteData.email || !inviteData.nome || !inviteData.senha || !inviteData.perfil) return
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
        empresaId: currentCompany.id
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar usuário')
    }

    setMessage({ type: 'success', text: 'Membro criado com sucesso!' })
    setShowInviteModal(false)
    setInviteData({
      nome: '',
      email: '',
      senha: '',
      cargo: '',
      perfil: 'editor',
      aprovador: false,
      ativo: true
    })
    loadMembros()
  } catch (error: any) {
    setMessage({ type: 'error', text: error.message || 'Erro ao criar usuário' })
  } finally {
    setIsInviting(false)
  }
}
```

**Step 3: Atualizar JSX do modal**

Substituir o modal existente pelo novo com todos os campos:

```tsx
{showInviteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="glass-card p-6 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <h4 className="text-xl font-semibold text-white mb-4">Convidar Membro</h4>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-white/60 text-sm mb-2">Nome completo *</label>
          <input
            type="text"
            value={inviteData.nome}
            onChange={(e) => setInviteData({ ...inviteData, nome: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
            placeholder="Nome do membro"
          />
        </div>

        {/* Email */}
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

        {/* Senha */}
        <div>
          <label className="block text-white/60 text-sm mb-2">Senha provisória *</label>
          <input
            type="password"
            value={inviteData.senha}
            onChange={(e) => setInviteData({ ...inviteData, senha: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
            placeholder="Mínimo 6 caracteres"
          />
          <p className="text-white/40 text-xs mt-1">O usuário deverá trocar no primeiro acesso</p>
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-white/60 text-sm mb-2">Cargo</label>
          <input
            type="text"
            value={inviteData.cargo}
            onChange={(e) => setInviteData({ ...inviteData, cargo: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
            placeholder="Ex: Gerente, Analista..."
          />
        </div>

        {/* Perfil */}
        <div>
          <label className="block text-white/60 text-sm mb-2">Perfil de acesso *</label>
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

        <div className="border-t border-white/10 pt-4 space-y-3">
          {/* Toggle Aprovador */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Aprovador</p>
              <p className="text-white/40 text-xs">Pode aprovar tarefas e validações</p>
            </div>
            <button
              type="button"
              onClick={() => setInviteData({ ...inviteData, aprovador: !inviteData.aprovador })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                inviteData.aprovador ? 'bg-nexum-primary' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  inviteData.aprovador ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Conta ativa</p>
              <p className="text-white/40 text-xs">Usuário pode fazer login</p>
            </div>
            <button
              type="button"
              onClick={() => setInviteData({ ...inviteData, ativo: !inviteData.ativo })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                inviteData.ativo ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  inviteData.ativo ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
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
          {isInviting ? 'Criando...' : 'Criar Membro'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Task 9: Adicionar toggle de status na listagem

**Files:**
- Modify: `src/app/configuracao/equipe/page.tsx`

**Step 1: Adicionar função para atualizar status**

```typescript
const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
  try {
    const response = await fetch(`/api/admin/usuarios/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !currentStatus })
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar status')
    }

    loadMembros()
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    setMessage({ type: 'error', text: 'Erro ao atualizar status do usuário' })
  }
}
```

**Step 2: Atualizar card do membro na listagem**

Adicionar toggle de status e cargo ao card existente:

```tsx
{membros.map((membro) => (
  <div key={membro.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
    <div className="w-12 h-12 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold">
      {membro.nome?.charAt(0).toUpperCase() || '?'}
    </div>
    <div className="flex-1">
      <p className="text-white font-medium">{membro.nome}</p>
      <p className="text-white/40 text-sm">{membro.email || 'Email não cadastrado'}</p>
      {membro.cargo && (
        <p className="text-white/50 text-xs mt-1">{membro.cargo}</p>
      )}
    </div>
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(membro.role)}`}>
      {getRoleLabel(membro.role)}
    </span>
    {membro.aprovador && (
      <span className="px-3 py-1 rounded-full text-xs font-medium text-yellow-400 bg-yellow-500/20">
        Aprovador
      </span>
    )}
    {/* Toggle de Status */}
    <button
      onClick={() => handleToggleStatus(membro.id, membro.ativo)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        membro.ativo ? 'bg-green-500' : 'bg-red-500/50'
      }`}
      title={membro.ativo ? 'Desativar conta' : 'Ativar conta'}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          membro.ativo ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  </div>
))}
```

---

## Task 10: Testar fluxo completo

**Step 1: Executar migration no Supabase**

- Abrir Supabase SQL Editor
- Executar conteúdo de `supabase/05-add-usuario-campos.sql`
- Verificar se colunas foram criadas com:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'usuarios';
  ```

**Step 2: Testar criação de usuário**

- Abrir `/configuracao/equipe`
- Clicar em "Convidar Membro"
- Preencher todos os campos
- Verificar se usuário aparece na listagem

**Step 3: Testar login com senha provisória**

- Fazer logout
- Fazer login com o novo usuário
- Verificar se redireciona para `/alterar-senha`
- Alterar senha
- Verificar se consegue acessar o sistema

**Step 4: Testar desativação de conta**

- Como admin, desativar o usuário criado
- Tentar fazer login com o usuário desativado
- Verificar se login é bloqueado

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/05-add-usuario-campos.sql` |
| Criar | `src/app/api/admin/usuarios/route.ts` |
| Criar | `src/app/api/admin/usuarios/[id]/route.ts` |
| Criar | `src/app/alterar-senha/page.tsx` |
| Criar | `src/app/api/auth/alterar-senha/route.ts` |
| Modificar | `src/types/index.ts` |
| Modificar | `src/app/configuracao/equipe/page.tsx` |
| Modificar | `src/middleware.ts` |
