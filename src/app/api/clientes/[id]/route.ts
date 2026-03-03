import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CAMPOS_AUDITADOS = ['mrr', 'dia_vencimento', 'participa_regua_cobranca', 'escopo']

// GET /api/clientes/[id] - Detalhes do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select(`
        *,
        servicos:servicos(id, nome),
        objetivos:objetivos(id, nome),
        equipe:usuarios(id, nome, email, cargo)
      `)
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT /api/clientes/[id] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

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

    const { data: clienteAtual, error: buscaError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (buscaError || !clienteAtual) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
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
      status,
      mrr,
      diaVencimento,
      participaReguaCobranca,
      servicosIds,
      objetivosIds,
      equipeIds,
      canais
    } = body

    const { error: updateError } = await supabase
      .from('clientes')
      .update({
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
        canais: canais || []
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (status && status !== clienteAtual.status) {
      await supabase.from('cliente_historico_status').insert({
        cliente_id: id,
        status_anterior: clienteAtual.status,
        status_novo: status,
        alterado_por: user.id
      })
    }

    for (const campo of CAMPOS_AUDITADOS) {
      const campoSnake = campo === 'diaVencimento' ? 'dia_vencimento' :
                         campo === 'participaReguaCobranca' ? 'participa_regua_cobranca' : campo
      const valorAnterior = String(clienteAtual[campoSnake] ?? '')
      const valorNovo = String(body[campo] ?? '')

      if (valorAnterior !== valorNovo) {
        await supabase.from('cliente_logs').insert({
          cliente_id: id,
          campo,
          valor_anterior: valorAnterior || null,
          valor_novo: valorNovo || null,
          alterado_por: user.id
        })
      }
    }

    if (servicosIds !== undefined) {
      await supabase.from('cliente_servicos').delete().eq('cliente_id', id)
      if (servicosIds.length > 0) {
        const servicosData = servicosIds.map((servicoId: string) => ({
          cliente_id: id,
          servico_id: servicoId
        }))
        await supabase.from('cliente_servicos').insert(servicosData)
      }
    }

    if (objetivosIds !== undefined) {
      await supabase.from('cliente_objetivos').delete().eq('cliente_id', id)
      if (objetivosIds.length > 0) {
        const objetivosData = objetivosIds.map((objetivoId: string) => ({
          cliente_id: id,
          objetivo_id: objetivoId
        }))
        await supabase.from('cliente_objetivos').insert(objetivosData)
      }
    }

    if (equipeIds !== undefined) {
      await supabase.from('cliente_equipe').delete().eq('cliente_id', id)
      if (equipeIds.length > 0) {
        const equipeData = equipeIds.map((usuarioId: string) => ({
          cliente_id: id,
          usuario_id: usuarioId
        }))
        await supabase.from('cliente_equipe').insert(equipeData)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/clientes/[id] - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

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

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
