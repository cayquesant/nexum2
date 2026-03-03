import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/clientes - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Pegar o token de autorização
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar usuário
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Filtros
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const busca = searchParams.get('busca')

    let query = supabase
      .from('clientes')
      .select('id, nome, email, telefone, status, mrr, dia_vencimento, criado_em, atualizado_em')
      .eq('empresa_id', usuario.empresa_id)
      .order('nome', { ascending: true })

    if (status && status !== 'todos') {
      query = query.eq('status', status)
    }

    if (busca) {
      query = query.ilike('nome', `%${busca}%`)
    }

    const { data: clientes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error('Erro ao listar clientes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST /api/clientes - Criar cliente
export async function POST(request: NextRequest) {
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
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    if (usuario.role !== 'SUPER_ADMIN' && usuario.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const {
      nome,
      email,
      telefone,
      website,
      instagram,
      briefing,
      escopo,
      status = 'ativo',
      mrr,
      diaVencimento,
      participaReguaCobranca = false,
      servicosIds = [],
      objetivosIds = [],
      equipeIds = [],
      canais = []
    } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        empresa_id: usuario.empresa_id,
        nome,
        email: email || null,
        telefone: telefone || null,
        website: website || null,
        instagram: instagram || null,
        briefing: briefing || null,
        escopo: escopo || null,
        status,
        mrr: mrr || null,
        dia_vencimento: diaVencimento || null,
        participa_regua_cobranca: participaReguaCobranca,
        canais: canais,
        criado_por: user.id
      })
      .select()
      .single()

    if (clienteError) {
      return NextResponse.json({ error: clienteError.message }, { status: 500 })
    }

    if (servicosIds.length > 0) {
      const servicosData = servicosIds.map((servicoId: string) => ({
        cliente_id: cliente.id,
        servico_id: servicoId
      }))
      await supabase.from('cliente_servicos').insert(servicosData)
    }

    if (objetivosIds.length > 0) {
      const objetivosData = objetivosIds.map((objetivoId: string) => ({
        cliente_id: cliente.id,
        objetivo_id: objetivoId
      }))
      await supabase.from('cliente_objetivos').insert(objetivosData)
    }

    if (equipeIds.length > 0) {
      const equipeData = equipeIds.map((usuarioId: string) => ({
        cliente_id: cliente.id,
        usuario_id: usuarioId
      }))
      await supabase.from('cliente_equipe').insert(equipeData)
    }

    await supabase.from('cliente_historico_status').insert({
      cliente_id: cliente.id,
      status_anterior: null,
      status_novo: status,
      alterado_por: user.id
    })

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
