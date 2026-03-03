import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const SEED_USER = {
  email: 'admin@nexum.com.br',
  password: 'nexum2026',
  nome: 'Admin Nexum',
  role: 'SUPER_ADMIN',
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas')
    console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any

  console.log('🚀 Iniciando setup do usuário seed...')
  console.log(`📧 Email: ${SEED_USER.email}`)

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message)
    process.exit(1)
  }

  const existingUser = existingUsers.users.find((u: { email: string }) => u.email === SEED_USER.email)
  
  let userId: string

  if (existingUser) {
    console.log('⚠️  Usuário já existe no Supabase Auth')
    userId = existingUser.id
    console.log(`📋 User ID: ${userId}`)
  } else {
    console.log('📝 Criando usuário no Supabase Auth...')
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: SEED_USER.email,
      password: SEED_USER.password,
      email_confirm: true,
      user_metadata: {
        nome: SEED_USER.nome,
      },
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message)
      process.exit(1)
    }

    userId = authData.user.id
    console.log('✅ Usuário criado no Supabase Auth')
    console.log(`📋 User ID: ${userId}`)
  }

  console.log('📝 Verificando registro na tabela usuarios...')

  const { data: existingUsuario, error: selectError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', userId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar usuário:', selectError.message)
    process.exit(1)
  }

  if (existingUsuario) {
    console.log('✅ Registro já existe na tabela usuarios')
  } else {
    console.log('📝 Inserindo registro na tabela usuarios...')

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        nome: SEED_USER.nome,
        email: SEED_USER.email,
        role: SEED_USER.role as 'SUPER_ADMIN',
        empresa_id: null,
        ativo: true,
        senha_provisoria: false,
      })

    if (insertError) {
      console.error('❌ Erro ao inserir na tabela usuarios:', insertError.message)
      process.exit(1)
    }

    console.log('✅ Registro inserido na tabela usuarios')
  }

  console.log('')
  console.log('🎉 Setup concluído com sucesso!')
  console.log('')
  console.log('📍 Credenciais do usuário seed:')
  console.log(`   Email: ${SEED_USER.email}`)
  console.log(`   Senha: ${SEED_USER.password}`)
  console.log(`   Role:  ${SEED_USER.role}`)
  console.log('')
  console.log('🔗 Acesse http://localhost:3002/login para testar')
}

main().catch(console.error)
