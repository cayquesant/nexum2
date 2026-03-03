-- =====================================================
-- NEXUM - Tabelas de Clientes
-- =====================================================
-- Execute este script no SQL Editor do Supabase
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
