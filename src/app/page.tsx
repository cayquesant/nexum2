'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, getRedirectPath } from '@/store'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role)
      router.replace(redirectPath)
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-nexum-primary/30"></div>
        <p className="text-white/50 text-sm">Carregando...</p>
      </div>
    </div>
  )
}
