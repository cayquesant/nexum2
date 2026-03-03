import { createClient } from '@/lib/supabase/browser'

export async function authFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient()

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('[authFetch] Erro ao obter sessão:', sessionError)
  }

  // Build full URL if relative
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  } else {
    console.warn('[authFetch] Sem token de acesso para:', url)
  }

  console.log('[authFetch] Fetching:', fullUrl)

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    console.log('[authFetch] Response:', response.status, response.statusText, 'for', url)

    return response
  } catch (error) {
    console.error('[authFetch] Erro:', error)
    throw error
  }
}
