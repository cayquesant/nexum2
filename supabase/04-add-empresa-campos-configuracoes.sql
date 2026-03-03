-- =====================================================
-- NEXUM - Migration: Adicionar campos à empresas e criar empresa_configuracoes
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNAS NA TABELA empresas
-- =====================================================

ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18) UNIQUE,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

-- Criar índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);

-- =====================================================
-- 2. CRIAR TABELA empresa_configuracoes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.empresa_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    dia_vencimento INTEGER DEFAULT 5,
    multa_atraso DECIMAL(5,2) DEFAULT 2.0,
    juros_mensal DECIMAL(5,2) DEFAULT 1.0,
    desconto_antecipado DECIMAL(5,2) DEFAULT 5.0,
    dias_tolerancia INTEGER DEFAULT 3,
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_empresa_config UNIQUE(empresa_id),
    CONSTRAINT dia_vencimento_valido CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    CONSTRAINT multa_atraso_valida CHECK (multa_atraso >= 0 AND multa_atraso <= 100),
    CONSTRAINT juros_mensal_valido CHECK (juros_mensal >= 0 AND juros_mensal <= 100),
    CONSTRAINT desconto_antecipado_valido CHECK (desconto_antecipado >= 0 AND desconto_antecipado <= 100),
    CONSTRAINT dias_tolerancia_validos CHECK (dias_tolerancia >= 0 AND dias_tolerancia <= 30)
);

CREATE INDEX IF NOT EXISTS idx_empresa_configuracoes_empresa_id ON public.empresa_configuracoes(empresa_id);

-- =====================================================
-- 3. TRIGGER: Atualizar atualizado_em automaticamente
-- =====================================================

CREATE TRIGGER update_empresa_configuracoes_updated_at
    BEFORE UPDATE ON public.empresa_configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. FUNÇÃO AUXILIAR: Verificar se é admin (criar antes das políticas)
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.usuarios
    WHERE id = auth.uid();
    
    RETURN user_role IN ('SUPER_ADMIN', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. HABILITAR RLS NA TABELA empresa_configuracoes
-- =====================================================

ALTER TABLE public.empresa_configuracoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver configurações da própria empresa
CREATE POLICY "Usuarios podem ver configuracoes da propria empresa"
    ON public.empresa_configuracoes FOR SELECT
    USING (empresa_id = get_current_user_empresa_id());

-- Política: Admins podem inserir configurações da própria empresa
CREATE POLICY "Admins podem inserir configuracoes da propria empresa"
    ON public.empresa_configuracoes FOR INSERT
    WITH CHECK (empresa_id = get_current_user_empresa_id() AND is_admin());

-- Política: Admins podem atualizar configurações da própria empresa
CREATE POLICY "Admins podem atualizar configuracoes da propria empresa"
    ON public.empresa_configuracoes FOR UPDATE
    USING (empresa_id = get_current_user_empresa_id() AND is_admin())
    WITH CHECK (empresa_id = get_current_user_empresa_id() AND is_admin());

-- Política: Admins podem deletar configurações da própria empresa
CREATE POLICY "Admins podem deletar configuracoes da propria empresa"
    ON public.empresa_configuracoes FOR DELETE
    USING (empresa_id = get_current_user_empresa_id() AND is_admin());

-- =====================================================
-- 6. ATUALIZAR POLÍTICAS RLS DA TABELA empresas
-- =====================================================

-- Política: Usuários podem ver dados da própria empresa
CREATE POLICY "Usuarios podem ver dados da propria empresa"
    ON public.empresas FOR SELECT
    USING (id = get_current_user_empresa_id() OR is_super_admin());

-- Política: Admins podem atualizar dados da própria empresa
CREATE POLICY "Admins podem atualizar dados da propria empresa"
    ON public.empresas FOR UPDATE
    USING (id = get_current_user_empresa_id() AND is_admin())
    WITH CHECK (id = get_current_user_empresa_id() AND is_admin());

-- =====================================================
-- 7. INSERIR CONFIGURACOES PADRAO PARA EMPRESAS EXISTENTES
-- =====================================================

INSERT INTO public.empresa_configuracoes (empresa_id, dia_vencimento, multa_atraso, juros_mensal, desconto_antecipado, dias_tolerancia)
SELECT id, 5, 2.0, 1.0, 5.0, 3
FROM public.empresas
WHERE NOT EXISTS (
    SELECT 1 FROM public.empresa_configuracoes 
    WHERE empresa_configuracoes.empresa_id = empresas.id
);
