# Gestão de Sócios Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refazer a página `/configuracao/regras-financeiras` para gerenciar sócios da empresa com nome e porcentagem de participação.

**Architecture:** Nova tabela `empresa_socios` com RLS para isolamento por empresa. UI seguindo padrão existente (EquipeContent) com modal para CRUD.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, @tabler/icons-react

---

## Task 1: Criar Migration SQL

**Files:**
- Create: `supabase/06-add-empresa-socios.sql`

**Step 1: Criar arquivo de migration**

```sql
-- =====================================================
-- NEXUM - Tabela de Sócios da Empresa
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- APÓS executar os scripts anteriores
-- =====================================================

-- =====================================================
-- TABELA: empresa_socios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.empresa_socios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    porcentagem DECIMAL(5,2) NOT NULL CHECK (porcentagem >= 0 AND porcentagem <= 100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por empresa
CREATE INDEX IF NOT EXISTS idx_empresa_socios_empresa_id ON public.empresa_socios(empresa_id);

-- =====================================================
-- TRIGGER: Atualizar atualizado_em automaticamente
-- =====================================================
CREATE TRIGGER update_empresa_socios_updated_at
    BEFORE UPDATE ON public.empresa_socios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HABILITAR RLS
-- =====================================================
ALTER TABLE public.empresa_socios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- SELECT: Usuários veem sócios da própria empresa
CREATE POLICY "empresa_socios_select_policy" ON public.empresa_socios
    FOR SELECT
    USING (
        is_super_admin() = true
        OR empresa_id = get_current_user_empresa_id()
    );

-- INSERT: admin/editor podem adicionar sócios à própria empresa
CREATE POLICY "empresa_socios_insert_policy" ON public.empresa_socios
    FOR INSERT
    WITH CHECK (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- UPDATE: admin/editor podem atualizar sócios da própria empresa
CREATE POLICY "empresa_socios_update_policy" ON public.empresa_socios
    FOR UPDATE
    USING (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
    )
    WITH CHECK (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- DELETE: admin pode excluir sócios da própria empresa
CREATE POLICY "empresa_socios_delete_policy" ON public.empresa_socios
    FOR DELETE
    USING (
        is_super_admin() = true
        OR (
            get_current_user_role() = 'admin'
            AND empresa_id = get_current_user_empresa_id()
        )
    );
```

**Step 2: Executar no Supabase**

- Abrir Supabase SQL Editor
- Executar o conteúdo do arquivo
- Verificar se tabela foi criada em Table Editor

---

## Task 2: Adicionar Tipo TypeScript

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Adicionar interface Socio**

Adicionar após a interface `Task`:

```typescript
export interface Socio {
  id: string
  empresaId: string
  nome: string
  porcentagem: number
  criadoEm: Date
  atualizadoEm: Date
}
```

---

## Task 3: Criar Componente SocioModal

**Files:**
- Create: `src/components/configuracao/SocioModal.tsx`

**Step 1: Criar o componente de modal**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

interface Socio {
  id?: string
  nome: string
  porcentagem: number
}

interface SocioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (socio: Socio) => Promise<void>
  socio?: Socio | null
  isSaving: boolean
}

export function SocioModal({ isOpen, onClose, onSave, socio, isSaving }: SocioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    porcentagem: 0
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (socio) {
      setFormData({
        nome: socio.nome,
        porcentagem: socio.porcentagem
      })
    } else {
      setFormData({ nome: '', porcentagem: 0 })
    }
    setError('')
  }, [socio, isOpen])

  const handleSubmit = async () => {
    setError('')

    if (formData.nome.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return
    }

    if (formData.porcentagem < 0 || formData.porcentagem > 100) {
      setError('Porcentagem deve estar entre 0 e 100')
      return
    }

    await onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card p-6 rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-white">
            {socio ? 'Editar Sócio' : 'Adicionar Sócio'}
          </h4>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <IconX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              placeholder="Nome do sócio"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Porcentagem (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.porcentagem}
              onChange={(e) => setFormData({ ...formData, porcentagem: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
              placeholder="Ex: 25"
            />
            <p className="text-white/40 text-sm mt-1">Valor entre 0 e 100</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : (socio ? 'Atualizar' : 'Adicionar')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 4: Reescrever Página de Sócios

**Files:**
- Modify: `src/app/configuracao/regras-financeiras/page.tsx`

**Step 1: Substituir todo o conteúdo da página**

```tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconUsers, IconLoader2, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react'
import { SocioModal } from '@/components/configuracao/SocioModal'

interface Socio {
  id: string
  nome: string
  porcentagem: number
}

export default function SociosPage() {
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [socios, setSocios] = useState<Socio[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [message, setMessage] = useState({ type: '', text: '' })

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

      const { data } = await supabase
        .from('empresa_socios')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('criado_em', { ascending: true })

      if (data) {
        setSocios(data.map((s: any) => ({
          id: s.id,
          nome: s.nome,
          porcentagem: s.porcentagem
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar sócios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (socioData: { nome: string; porcentagem: number }) => {
    if (!currentCompany) return
    setIsSaving(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      if (editingSocio) {
        const { error } = await supabase
          .from('empresa_socios')
          .update({
            nome: socioData.nome,
            porcentagem: socioData.porcentagem
          })
          .eq('id', editingSocio.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Sócio atualizado com sucesso!' })
      } else {
        const { error } = await supabase
          .from('empresa_socios')
          .insert({
            empresa_id: currentCompany.id,
            nome: socioData.nome,
            porcentagem: socioData.porcentagem
          })

        if (error) throw error
        setMessage({ type: 'success', text: 'Sócio adicionado com sucesso!' })
      }

      setShowModal(false)
      setEditingSocio(null)
      loadSocios()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar sócio' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (socioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sócio?')) return

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { error } = await supabase
        .from('empresa_socios')
        .delete()
        .eq('id', socioId)

      if (error) throw error
      setMessage({ type: 'success', text: 'Sócio excluído com sucesso!' })
      loadSocios()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir sócio' })
    }
  }

  const openEditModal = (socio: Socio) => {
    setEditingSocio(socio)
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingSocio(null)
    setShowModal(true)
  }

  const totalPorcentagem = socios.reduce((sum, s) => sum + s.porcentagem, 0)
  const isTotalValid = Math.abs(totalPorcentagem - 100) < 0.01

  const pageContent = !currentCompany ? (
    <div className="glass-card p-8 text-center">
      <p className="text-white/60">Selecione uma empresa para configurar</p>
    </div>
  ) : isLoading ? (
    <div className="flex items-center justify-center py-12">
      <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IconUsers size={22} />
            Sócios da Empresa
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os sócios e suas participações</p>
        </div>
        {canCreateEdit && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <IconPlus size={18} />
            Adicionar Sócio
          </button>
        )}
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        {socios.length > 0 ? (
          <div className="space-y-3">
            {socios.map((socio) => (
              <div key={socio.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {socio.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{socio.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-nexum-primary font-semibold">{socio.porcentagem}%</p>
                  <p className="text-white/40 text-xs">participação</p>
                </div>
                {canCreateEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(socio)}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(socio.id)}
                      className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-center py-8">Nenhum sócio cadastrado</p>
        )}

        <div className={`mt-6 p-4 rounded-xl border ${isTotalValid ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Total das Participações</p>
              {!isTotalValid && socios.length > 0 && (
                <p className="text-yellow-400 text-sm">A soma não é igual a 100%</p>
              )}
            </div>
            <p className={`text-2xl font-bold ${isTotalValid ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalPorcentagem.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout activeMenu="configuracao" configSubmenuOpen={true}>
      {pageContent}
      <SocioModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingSocio(null) }}
        onSave={handleSave}
        socio={editingSocio}
        isSaving={isSaving}
      />
    </DashboardLayout>
  )
}
```

---

## Task 5: Verificar Funcionamento

**Step 1: Executar migration no Supabase**

- Abrir Supabase Dashboard
- Ir para SQL Editor
- Executar conteúdo de `supabase/06-add-empresa-socios.sql`
- Verificar tabela criada

**Step 2: Testar aplicação**

```bash
npm run dev
```

**Step 3: Verificar funcionalidades**

- [ ] Página carrega sem erros
- [ ] Lista vazia mostra mensagem "Nenhum sócio cadastrado"
- [ ] Botão "Adicionar Sócio" abre modal
- [ ] Validação: nome mínimo 2 caracteres
- [ ] Validação: porcentagem 0-100
- [ ] Criar sócio funciona
- [ ] Editar sócio funciona
- [ ] Excluir sócio funciona (com confirmação)
- [ ] Total aparece em verde quando 100%
- [ ] Total aparece em amarelo quando ≠ 100%
