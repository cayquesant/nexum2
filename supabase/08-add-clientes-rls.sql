-- =====================================================
-- NEXUM - RLS para Tabelas de Clientes
-- =====================================================
-- Execute este script no SQL Editor do Supabase
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
