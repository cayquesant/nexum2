'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfiguracaoRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/configuracao/empresa')
  }, [router])

  return null
}
