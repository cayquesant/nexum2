-- =====================================================
-- NEXUM - Seed de Desenvolvimento
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- APÓS executar 01-schema.sql e 02-rls.sql
-- =====================================================

-- =====================================================
-- IMPORTANTE: Criação do Usuário SUPER_ADMIN
-- =====================================================
-- O processo de criação do usuário deve ser feito em duas etapas:
-- 
-- ETAPA 1: Criar usuário no Supabase Auth
-- ------------------------------------------
-- No painel do Supabase, vá em:
-- Authentication > Users > Add user
-- 
-- Email: admin@nexum.com.br
-- Password: nexum2026
-- Role: authenticated (padrão)
-- Auto Confirm User: YES (marcar esta opção)
-- 
-- OU use a API/SDK:
-- const { data, error } = await supabase.auth.signUp({
--   email: 'admin@nexum.com.br',
--   password: 'nexum2026',
--   options: {
--     emailRedirectTo: undefined,
--     data: {
--       role: 'SUPER_ADMIN'
--     }
--   }
-- })
-- 
-- ETAPA 2: Executar o SQL abaixo para criar o registro
--          na tabela usuarios
-- =====================================================

-- =====================================================
-- INSERIR USUÁRIO SUPER_ADMIN
-- =====================================================
-- IMPORTANTE: Substitua 'USER_UUID_AQUI' pelo UUID
-- retornado na criação do usuário no Supabase Auth
-- Você pode obter o UUID executando:
-- SELECT id, email FROM auth.users WHERE email = 'admin@nexum.com.br';

-- Descomente e execute após obter o UUID:
-- INSERT INTO public.usuarios (id, nome, role, empresa_id)
-- VALUES (
--     'USER_UUID_AQUI',
--     'Administrador Nexum',
--     'SUPER_ADMIN',
--     NULL
-- );

-- =====================================================
-- FUNÇÃO AUXILIAR: Criar usuário SUPER_ADMIN
-- =====================================================
-- Esta função facilita a criação do registro na tabela
-- usuarios após o usuário ser criado no Auth

CREATE OR REPLACE FUNCTION create_super_admin_user(
    user_email VARCHAR,
    user_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado no auth.users. Crie o usuário primeiro via Supabase Auth.';
    END IF;
    
    INSERT INTO public.usuarios (id, nome, role, empresa_id)
    VALUES (user_uuid, user_name, 'SUPER_ADMIN', NULL)
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        role = EXCLUDED.role;
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EXECUTAR APÓS CRIAR USUÁRIO NO AUTH
-- =====================================================
-- Depois de criar o usuário admin@nexum.com.br no
-- Supabase Auth, execute:
-- 
-- SELECT create_super_admin_user('admin@nexum.com.br', 'Administrador Nexum');
-- 
-- Isso criará automaticamente o registro na tabela usuarios

-- =====================================================
-- VERIFICAR SEED
-- =====================================================
-- Para verificar se o usuário foi criado corretamente:
-- 
-- SELECT 
--     u.id,
--     u.nome,
--     u.role,
--     u.empresa_id,
--     a.email,
--     a.created_at
-- FROM public.usuarios u
-- JOIN auth.users a ON a.id = u.id
-- WHERE a.email = 'admin@nexum.com.br';
