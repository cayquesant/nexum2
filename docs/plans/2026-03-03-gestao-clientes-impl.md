# Gestão de Clientes - Plano de Implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar página completa de gestão de clientes com listagem, filtros, modal de edição com 6 abas, e sistema de logs/auditoria.

**Architecture:** Tabela principal `clientes` com JSONB para canais, tabelas auxiliares para serviços/objetivos, junction tables para relacionamentos N:N, e tabelas de histórico/logs para auditoria.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, Zustand

---

## Task 1: Database Migration - Schema Principal

**Files:**
- Create: `supabase/07-add-clientes-tables.sql`

**Step 1: Criar arquivo de migration**

```sql
-- =====================================================
-- NEXUM - Tabelas de Clientes
-- =====================================================

-- Tabela principal: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,

    -- Dados básicos
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    website VARCHAR(255),
    instagram VARCHAR(100),
    briefing TEXT,
    escopo TEXT,

    -- Financeiro e status
    status VARCHAR(20) NOT NULL DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'pausado', 'cancelado')),
    mrr DECIMAL(10,2),
    dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    participa_regua_cobranca BOOLEAN DEFAULT false,

    -- Canais com credenciais (JSONB)
    canais JSONB DEFAULT '[]'::jsonb,

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES public.usuarios(id)
);

-- Tabela: servicos
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: objetivos
CREATE TABLE IF NOT EXISTS public.objetivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction tables
CREATE TABLE IF NOT EXISTS public.cliente_servicos (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, servico_id)
);

CREATE TABLE IF NOT EXISTS public.cliente_objetivos (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    objetivo_id UUID REFERENCES public.objetivos(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, objetivo_id)
);

CREATE TABLE IF NOT EXISTS public.cliente_equipe (
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, usuario_id)
);

-- Histórico e Logs
CREATE TABLE IF NOT EXISTS public.cliente_historico_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    alterado_por UUID REFERENCES public.usuarios(id),
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cliente_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    campo VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    alterado_por UUID REFERENCES public.usuarios(id),
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_servicos_empresa_id ON public.servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_empresa_id ON public.objetivos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_cliente_id ON public.cliente_historico_status(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_logs_cliente_id ON public.cliente_logs(cliente_id);

-- Trigger para atualizado_em
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Executar no Supabase SQL Editor**
- Abrir Supabase Dashboard
- Ir em SQL Editor
- Executar o script

---

## Task 2: Database Migration - RLS Policies

**Files:**
- Create: `supabase/08-add-clientes-rls.sql`

**Step 1: Criar arquivo de RLS**

```sql
-- =====================================================
-- NEXUM - RLS para Tabelas de Clientes
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_historico_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_logs ENABLE ROW LEVEL SECURITY;

-- CLIENTES - Policies
CREATE POLICY "clientes_select" ON public.clientes
    FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "clientes_insert" ON public.clientes
    FOR INSERT WITH CHECK (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "clientes_update" ON public.clientes
    FOR UPDATE USING (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "clientes_delete" ON public.clientes
    FOR DELETE USING (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

-- SERVIÇOS - Policies
CREATE POLICY "servicos_select" ON public.servicos
    FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "servicos_insert" ON public.servicos
    FOR INSERT WITH CHECK (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

-- OBJETIVOS - Policies
CREATE POLICY "objetivos_select" ON public.objetivos
    FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "objetivos_insert" ON public.objetivos
    FOR INSERT WITH CHECK (
        empresa_id = get_current_user_empresa_id()
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

-- JUNCTION TABLES - Policies (baseadas no cliente)
CREATE POLICY "cliente_servicos_select" ON public.cliente_servicos
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
    );

CREATE POLICY "cliente_servicos_insert" ON public.cliente_servicos
    FOR INSERT WITH CHECK (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_servicos_delete" ON public.cliente_servicos
    FOR DELETE USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_objetivos_select" ON public.cliente_objetivos
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
    );

CREATE POLICY "cliente_objetivos_insert" ON public.cliente_objetivos
    FOR INSERT WITH CHECK (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_objetivos_delete" ON public.cliente_objetivos
    FOR DELETE USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_equipe_select" ON public.cliente_equipe
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
    );

CREATE POLICY "cliente_equipe_insert" ON public.cliente_equipe
    FOR INSERT WITH CHECK (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_equipe_delete" ON public.cliente_equipe
    FOR DELETE USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

-- HISTÓRICO e LOGS - Policies
CREATE POLICY "cliente_historico_select" ON public.cliente_historico_status
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
    );

CREATE POLICY "cliente_historico_insert" ON public.cliente_historico_status
    FOR INSERT WITH CHECK (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );

CREATE POLICY "cliente_logs_select" ON public.cliente_logs
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
    );

CREATE POLICY "cliente_logs_insert" ON public.cliente_logs
    FOR INSERT WITH CHECK (
        cliente_id IN (SELECT id FROM public.clientes WHERE empresa_id = get_current_user_empresa_id())
        AND (is_super_admin() OR get_current_user_role() = 'admin')
    );
```

**Step 2: Executar no Supabase SQL Editor**

---

## Task 3: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Adicionar tipos de cliente ao final do arquivo**

Ver arquivo atual e adicionar os tipos conforme design.

---

## Task 4: API - Listar e Criar Clientes

**Files:**
- Create: `src/app/api/clientes/route.ts`

**Step 1: Criar API route para GET e POST**

---

## Task 5: API - Detalhes, Atualizar e Deletar Cliente

**Files:**
- Create: `src/app/api/clientes/[id]/route.ts`

**Step 1: Criar API route para GET, PUT, DELETE**

---

## Task 6: API - Serviços

**Files:**
- Create: `src/app/api/servicos/route.ts`

---

## Task 7: API - Objetivos

**Files:**
- Create: `src/app/api/objetivos/route.ts`

---

## Task 8: API - Histórico do Cliente

**Files:**
- Create: `src/app/api/clientes/[id]/historico/route.ts`

---

## Task 9: Componente - StatusBadge

**Files:**
- Create: `src/components/clientes/StatusBadge.tsx`

---

## Task 10: Componente - MultiSelectCreatable

**Files:**
- Create: `src/components/clientes/MultiSelectCreatable.tsx`

---

## Task 11: Componente - CanaisCredenciais

**Files:**
- Create: `src/components/clientes/CanaisCredenciais.tsx`

---

## Task 12: Componente - ClienteCard

**Files:**
- Create: `src/components/clientes/ClienteCard.tsx`

---

## Task 13: Componente - ClienteFormDados

**Files:**
- Create: `src/components/clientes/ClienteFormDados.tsx`

---

## Task 14: Componente - ClienteFormFinanceiro

**Files:**
- Create: `src/components/clientes/ClienteFormFinanceiro.tsx`

---

## Task 15: Componente - ClienteFormEscopo

**Files:**
- Create: `src/components/clientes/ClienteFormEscopo.tsx`

---

## Task 16: Componente - ClienteFormEquipe

**Files:**
- Create: `src/components/clientes/ClienteFormEquipe.tsx`

---

## Task 17: Componente - ClienteFormEstrategia

**Files:**
- Create: `src/components/clientes/ClienteFormEstrategia.tsx`

---

## Task 18: Componente - ClienteHistorico

**Files:**
- Create: `src/components/clientes/ClienteHistorico.tsx`

---

## Task 19: Componente - ClienteModal

**Files:**
- Create: `src/components/clientes/ClienteModal.tsx`

---

## Task 20: Componente - ClienteList

**Files:**
- Create: `src/components/clientes/ClienteList.tsx`

---

## Task 21: Página Principal

**Files:**
- Modify: `src/app/configuracao/gestao-clientes/page.tsx`

**Step 1: Refatorar página para usar novos componentes**

---

## Ordem de Execução

1. Tasks 1-2: Database (executar SQL no Supabase)
2. Task 3: Types
3. Tasks 4-8: APIs
4. Tasks 9-20: Componentes (ordem conforme dependências)
5. Task 21: Página principal
