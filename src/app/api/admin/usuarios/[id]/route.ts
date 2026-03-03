import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { ativo, aprovador, cargo } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuario e obrigatorio' },
        { status: 400 }
      )
    }

    // Criar cliente admin com service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Construir objeto de atualizacao apenas com campos fornecidos
    const updates: Record<string, unknown> = {}
    if (ativo !== undefined) updates.ativo = ativo
    if (aprovador !== undefined) updates.aprovador = aprovador
    if (cargo !== undefined) updates.cargo = cargo

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Atualizar registro na tabela usuarios
    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar usuario:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar usuario' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
