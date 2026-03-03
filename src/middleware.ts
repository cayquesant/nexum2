import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthenticated = !!session

  // Rota raiz
  if (pathname === '/') {
    if (isAuthenticated) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('role, senha_provisoria, ativo')
        .eq('id', session.user.id)
        .single()

      // Verificar se conta esta ativa
      if (usuario?.ativo === false) {
        // Fazer logout e redirecionar para login
        await supabase.auth.signOut()
        const response = NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
        return response
      }

      // Verificar se precisa trocar senha
      if (usuario?.senha_provisoria === true) {
        return NextResponse.redirect(new URL('/alterar-senha', request.url))
      }

      if (usuario?.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }

      return NextResponse.redirect(new URL('/atividades', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rota de login
  if (pathname === '/login') {
    if (isAuthenticated) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('role, senha_provisoria, ativo')
        .eq('id', session.user.id)
        .single()

      // Verificar se conta esta ativa
      if (usuario?.ativo === false) {
        await supabase.auth.signOut()
        const response = NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
        return response
      }

      // Verificar se precisa trocar senha
      if (usuario?.senha_provisoria === true) {
        return NextResponse.redirect(new URL('/alterar-senha', request.url))
      }

      if (usuario?.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.redirect(new URL('/atividades', request.url))
    }
    return supabaseResponse
  }

  // Rota de alterar senha - permitir acesso mesmo com senha provisoria
  if (pathname === '/alterar-senha') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('ativo')
      .eq('id', session.user.id)
      .single()

    // Verificar se conta esta ativa
    if (usuario?.ativo === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
    }

    return supabaseResponse
  }

  // Rota superadmin
  if (pathname === '/superadmin') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role, senha_provisoria, ativo')
      .eq('id', session.user.id)
      .single()

    // Verificar se conta esta ativa
    if (usuario?.ativo === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
    }

    // Verificar se precisa trocar senha
    if (usuario?.senha_provisoria === true) {
      return NextResponse.redirect(new URL('/alterar-senha', request.url))
    }

    if (!usuario || usuario.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/atividades', request.url))
    }

    return supabaseResponse
  }

  // Rota atividades
  if (pathname === '/atividades') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('senha_provisoria, ativo')
      .eq('id', session.user.id)
      .single()

    // Verificar se conta esta ativa
    if (usuario?.ativo === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
    }

    // Verificar se precisa trocar senha
    if (usuario?.senha_provisoria === true) {
      return NextResponse.redirect(new URL('/alterar-senha', request.url))
    }

    return supabaseResponse
  }

  // Rotas protegidas em geral - verificar senha provisoria e conta ativa
  if (isAuthenticated) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('senha_provisoria, ativo')
      .eq('id', session.user.id)
      .single()

    // Verificar se conta esta ativa
    if (usuario?.ativo === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=conta_desativada', request.url))
    }

    // Verificar se precisa trocar senha (exceto na propria pagina de alterar senha)
    if (pathname !== '/alterar-senha' && usuario?.senha_provisoria === true) {
      return NextResponse.redirect(new URL('/alterar-senha', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/login', '/superadmin', '/atividades', '/alterar-senha', '/configuracao/:path*'],
}
