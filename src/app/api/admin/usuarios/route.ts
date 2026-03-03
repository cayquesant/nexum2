import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/admin/usuarios - Listar usuários da empresa
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, cargo, role, ativo')
      .eq('empresa_id', usuario.empresa_id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const usuariosFormatados = usuarios?.map(u => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      cargo: u.cargo,
      role: u.role,
      ativo: u.ativo
    }))

    return NextResponse.json({ usuarios: usuariosFormatados })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST /api/admin/usuarios - Criar usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, senha, cargo, perfil, aprovador, ativo, empresaId } = body

    console.log('[API POST /api/admin/usuarios] Body:', body)

    if (!nome || !email || !senha || !perfil || !empresaId) {
      console.log('Validation failed - missing fields:', { nome: !!nome, email: !!email, senha: !!senha, perfil: !!perfil, empresaId: !!empresaId })
      return NextResponse.json(
        { error: 'Campos obrigatorios: nome, email, senha, perfil, empresaId' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no minimo 6 caracteres' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'visualizador'].includes(perfil)) {
      return NextResponse.json(
        { error: 'Perfil invalido. Use: admin, editor ou visualizador' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        role: perfil
      }
    })

    if (authError) {
      console.error('Erro ao criar usuario no auth:', authError)
      return NextResponse.json(
        { error: authError.message || 'Erro ao criar usuario' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuario' },
        { status: 400 }
      )
    }

    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome,
        email,
        role: perfil,
        cargo: cargo || null,
        aprovador: aprovador || false,
        ativo: ativo !== undefined ? ativo : true,
        senha_provisoria: true,
        empresa_id: empresaId
      })

    if (dbError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Erro ao criar registro na tabela usuarios:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Erro ao criar registro de usuario' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        nome,
        role: perfil
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
