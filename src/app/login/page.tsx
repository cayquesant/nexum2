'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, getRedirectPath } from '@/store'
import { createClient } from '@/lib/supabase/browser'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError, isAuthenticated, user, checkSession } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      await checkSession()
      setIsCheckingSession(false)
    }
    verifySession()
  }, [checkSession])

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role)
      router.replace(redirectPath)
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNetworkError(false)
    clearError()

    if (!email || !password) {
      return
    }

    try {
      const success = await login(email, password)
      if (success && user) {
        const redirectPath = getRedirectPath(user.role)
        router.replace(redirectPath)
      }
    } catch {
      setNetworkError(true)
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecoveryLoading(true)
    setRecoveryError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setRecoveryError(error.message)
      } else {
        setRecoverySent(true)
      }
    } catch {
      setRecoveryError('Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-nexum-primary" size={40} />
          <p className="text-white/60">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (showRecovery) {
    return (
      <div className="min-h-screen bg-nexum-darker flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexum-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nexum-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        </div>

        <div className="relative w-full max-w-md">
          <button
            onClick={() => {
              setShowRecovery(false)
              setRecoverySent(false)
              setRecoveryEmail('')
              setRecoveryError(null)
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao login
          </button>

          <div className="dark-card p-8">
            {!recoverySent ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h1>
                  <p className="text-white/60 text-sm">
                    Digite seu email para receber as instruções de recuperação
                  </p>
                </div>

                {recoveryError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Erro</p>
                      <p className="text-red-400/70 text-xs mt-1">{recoveryError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRecovery} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                      type="email"
                      placeholder="Seu email"
                      value={recoveryEmail}
                      onChange={(e) => {
                        setRecoveryEmail(e.target.value)
                        setRecoveryError(null)
                      }}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading || !recoveryEmail}
                    className="w-full bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Enviando...
                      </>
                    ) : (
                      'Enviar instruções'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-green-400" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Email Enviado!</h2>
                <p className="text-white/60 text-sm">
                  Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha em alguns minutos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nexum-darker flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexum-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nexum-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Nexum</h1>
          <p className="text-white/60">Sistema de Gestão Empresarial</p>
        </div>

        <div className="dark-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Acesse sua conta</h2>

          {(error || networkError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-400 text-sm font-medium">
                  {networkError ? 'Erro de conexão' : 'Credenciais inválidas'}
                </p>
                <p className="text-red-400/70 text-xs mt-1">
                  {networkError
                    ? 'Verifique sua conexão com a internet e tente novamente.'
                    : error || 'Email ou senha incorretos. Por favor, tente novamente.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                  setNetworkError(false)
                }}
                required
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                  setNetworkError(false)
                }}
                required
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:border-nexum-primary focus:ring-1 focus:ring-nexum-primary transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowRecovery(true)}
              className="text-nexum-primary hover:text-nexum-secondary text-sm transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs text-center mb-2">Credenciais de demonstração (DEV)</p>
          <div className="text-center space-y-1">
            <p className="text-white/60 text-sm">
              <span className="text-white/40">Email:</span> admin@nexum.com.br
            </p>
            <p className="text-white/60 text-sm">
              <span className="text-white/40">Senha:</span> nexum2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
