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
