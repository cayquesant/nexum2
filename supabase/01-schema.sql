-- =====================================================
-- NEXUM - Estrutura do Banco de Dados
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: empresas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_empresas_status ON public.empresas(status);

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'visualizador' CHECK (role IN ('SUPER_ADMIN', 'admin', 'editor', 'visualizador')),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON public.usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);

-- =====================================================
-- TABELA: tarefas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    prioridade VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (prioridade IN ('low', 'medium', 'high')),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    criado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento DATE
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_id ON public.tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel_id ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas(data_vencimento);

-- =====================================================
-- TRIGGER: Atualizar atualizado_em automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tarefas_updated_at
    BEFORE UPDATE ON public.tarefas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Obter role do usuário atual
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.usuarios
    WHERE id = auth.uid();
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Verificar se usuário é SUPER_ADMIN
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.usuarios
    WHERE id = auth.uid();
    
    RETURN user_role = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Obter empresa_id do usuário atual
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
DECLARE
    empresa_uuid UUID;
BEGIN
    SELECT empresa_id INTO empresa_uuid
    FROM public.usuarios
    WHERE id = auth.uid();
    
    RETURN empresa_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
