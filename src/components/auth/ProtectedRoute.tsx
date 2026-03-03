'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store'
import { UserRole, getRedirectPath } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo 
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      const loginUrl = redirectTo ? redirectTo : `/login?redirect=${encodeURIComponent(pathname)}`
      router.replace(loginUrl)
      return
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      const fallbackPath = getRedirectPath(user.role)
      router.replace(fallbackPath)
    }
  }, [isAuthenticated, user, allowedRoles, router, pathname, redirectTo])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-nexum-primary" size={40} />
          <p className="text-white/60 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-nexum-primary" size={40} />
          <p className="text-white/60 text-sm">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface GuestRouteProps {
  children: ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role)
      router.replace(redirectPath)
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-nexum-primary" size={40} />
          <p className="text-white/60 text-sm">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
