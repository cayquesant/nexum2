-- =====================================================
-- NEXUM - Migration: Sincronizar auth.users com public.usuarios
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- FUNÇÃO AUXILIAR: Converter empresa_id de forma segura
-- =====================================================
CREATE OR REPLACE FUNCTION public.safe_empresa_id(metadata jsonb)
RETURNS UUID AS $$
BEGIN
    -- Se o campo existe e é um UUID válido, retorna o UUID
    -- Senão, retorna NULL
    IF metadata ? 'empresa_id' AND (metadata->>'empresa_id') ~ '^[0-9a-fA-F-]{36}$' THEN
        RETURN (metadata->>'empresa_id')::uuid;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- FUNÇÃO: Criar registro em public.usuarios quando usuário é criado no auth
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (
        id,
        nome,
        email,
        role,
        empresa_id,
        ativo,
        senha_provisoria,
        cargo,
        aprovador
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'visualizador'),
        public.safe_empresa_id(NEW.raw_user_meta_data),
        COALESCE((NEW.raw_user_meta_data->>'ativo')::boolean, TRUE),
        COALESCE((NEW.raw_user_meta_data->>'senha_provisoria')::boolean, TRUE),
        NEW.raw_user_meta_data->>'cargo',
        COALESCE((NEW.raw_user_meta_data->>'aprovador')::boolean, FALSE)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- TRIGGER: Executar função quando usuário é criado no auth
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNÇÃO: Atualizar public.usuarios quando email é alterado no auth
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o email mudou, atualizar na tabela usuarios
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE public.usuarios
        SET email = NEW.email
        WHERE id = NEW.id;
    END IF;

    -- Se o metadata mudou, atualizar campos relevantes
    IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        UPDATE public.usuarios
        SET
            nome = COALESCE(NEW.raw_user_meta_data->>'nome', nome),
            email = COALESCE(NEW.raw_user_meta_data->>'email', email),
            role = COALESCE(NEW.raw_user_meta_data->>'role', role),
            cargo = NEW.raw_user_meta_data->>'cargo',
            aprovador = COALESCE((NEW.raw_user_meta_data->>'aprovador')::boolean, aprovador),
            ativo = COALESCE((NEW.raw_user_meta_data->>'ativo')::boolean, ativo),
            empresa_id = CASE
                WHEN (NEW.raw_user_meta_data->>'empresa_id') ~ '^[0-9a-fA-F-]{36}$'
                THEN (NEW.raw_user_meta_data->>'empresa_id')::uuid
                ELSE empresa_id
            END
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- TRIGGER: Executar função quando usuário é atualizado no auth
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_email_update();

-- =====================================================
-- FUNÇÃO: Deletar registro em public.usuarios quando usuário é deletado do auth
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.usuarios WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- TRIGGER: Executar função quando usuário é deletado do auth
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();
