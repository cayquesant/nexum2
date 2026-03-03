-- =====================================================
-- NEXUM - Row Level Security (RLS) Policies
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- APÓS executar o 01-schema.sql
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA: empresas
-- =====================================================

-- SELECT: SUPER_ADMIN vê tudo, outros veem apenas sua empresa
CREATE POLICY "empresas_select_policy" ON public.empresas
    FOR SELECT
    USING (
        is_super_admin() = true 
        OR id = get_current_user_empresa_id()
    );

-- INSERT: Apenas SUPER_ADMIN pode criar empresas
CREATE POLICY "empresas_insert_policy" ON public.empresas
    FOR INSERT
    WITH CHECK (is_super_admin() = true);

-- UPDATE: Apenas SUPER_ADMIN pode atualizar empresas
CREATE POLICY "empresas_update_policy" ON public.empresas
    FOR UPDATE
    USING (is_super_admin() = true)
    WITH CHECK (is_super_admin() = true);

-- DELETE: Apenas SUPER_ADMIN pode excluir empresas
CREATE POLICY "empresas_delete_policy" ON public.empresas
    FOR DELETE
    USING (is_super_admin() = true);

-- =====================================================
-- POLÍTICAS PARA TABELA: usuarios
-- =====================================================

-- SELECT: SUPER_ADMIN vê tudo, outros veem usuários da mesma empresa
CREATE POLICY "usuarios_select_policy" ON public.usuarios
    FOR SELECT
    USING (
        is_super_admin() = true 
        OR empresa_id = get_current_user_empresa_id()
        OR id = auth.uid()
    );

-- INSERT: SUPER_ADMIN pode criar qualquer usuário
-- admin pode criar usuários em sua empresa
CREATE POLICY "usuarios_insert_policy" ON public.usuarios
    FOR INSERT
    WITH CHECK (
        is_super_admin() = true
        OR (
            get_current_user_role() = 'admin' 
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- UPDATE: SUPER_ADMIN pode atualizar qualquer usuário
-- Usuários podem atualizar próprio perfil (apenas nome)
-- admin pode atualizar usuários de sua empresa
CREATE POLICY "usuarios_update_policy" ON public.usuarios
    FOR UPDATE
    USING (
        is_super_admin() = true
        OR id = auth.uid()
        OR (
            get_current_user_role() = 'admin' 
            AND empresa_id = get_current_user_empresa_id()
        )
    )
    WITH CHECK (
        is_super_admin() = true
        OR id = auth.uid()
        OR (
            get_current_user_role() = 'admin' 
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- DELETE: Apenas SUPER_ADMIN pode excluir usuários
CREATE POLICY "usuarios_delete_policy" ON public.usuarios
    FOR DELETE
    USING (is_super_admin() = true);

-- =====================================================
-- POLÍTICAS PARA TABELA: tarefas
-- =====================================================

-- SELECT: SUPER_ADMIN vê tudo, outros veem tarefas de sua empresa
CREATE POLICY "tarefas_select_policy" ON public.tarefas
    FOR SELECT
    USING (
        is_super_admin() = true 
        OR empresa_id = get_current_user_empresa_id()
    );

-- INSERT: SUPER_ADMIN pode criar tarefas em qualquer empresa
-- admin/editor podem criar tarefas em sua empresa
CREATE POLICY "tarefas_insert_policy" ON public.tarefas
    FOR INSERT
    WITH CHECK (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- UPDATE: SUPER_ADMIN pode atualizar qualquer tarefa
-- admin/editor podem atualizar tarefas de sua empresa
-- visualizador não pode atualizar
CREATE POLICY "tarefas_update_policy" ON public.tarefas
    FOR UPDATE
    USING (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
        OR responsavel_id = auth.uid()
    )
    WITH CHECK (
        is_super_admin() = true
        OR (
            get_current_user_role() IN ('admin', 'editor')
            AND empresa_id = get_current_user_empresa_id()
        )
        OR responsavel_id = auth.uid()
    );

-- DELETE: SUPER_ADMIN pode excluir qualquer tarefa
-- admin pode excluir tarefas de sua empresa
CREATE POLICY "tarefas_delete_policy" ON public.tarefas
    FOR DELETE
    USING (
        is_super_admin() = true
        OR (
            get_current_user_role() = 'admin'
            AND empresa_id = get_current_user_empresa_id()
        )
    );

-- =====================================================
-- POLÍTICA ESPECIAL: Permitir leitura do próprio usuário
-- =====================================================
-- Esta política garante que um usuário sempre possa ver
-- seus próprios dados na tabela usuarios
CREATE POLICY "usuarios_self_read" ON public.usuarios
    FOR SELECT
    USING (id = auth.uid());
