-- =====================================================
-- NEXUM - Migration: Adicionar campos a tabela usuarios
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

-- Criar indices para busca
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
