import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/clientes/[id]/historico - Histórico de status
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

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const { data: historico, error } = await supabase
      .from('cliente_historico_status')
      .select('id, cliente_id, status_anterior, status_novo, alterado_por, alterado_em')
      .eq('cliente_id', id)
      .order('alterado_em', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const usuarioIds = historico?.filter(h => h.alterado_por).map(h => h.alterado_por) || []
    let usuarios: Record<string, string> = {}

    if (usuarioIds.length > 0) {
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', usuarioIds)

      usuarios = Object.fromEntries(usuariosData?.map(u => [u.id, u.nome]) || [])
    }

    const historicoComNomes = historico?.map(h => ({
      ...h,
      alteradoPorNome: h.alterado_por ? usuarios[h.alterado_por] : null
    }))

    return NextResponse.json({ historico: historicoComNomes })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
