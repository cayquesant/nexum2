'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { IconLock, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react'

export default function AlterarSenhaPage() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Atualizar senha no auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Atualizar flag de senha_provisoria
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (userId) {
        const response = await fetch('/api/auth/alterar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })

        if (!response.ok) {
          const result = await response.json()
          console.error('Erro ao atualizar flag de senha provisoria:', result.error)
        }
      }

      // Usar window.location.href para forçar full page reload e garantir que o middleware rode novamente
      window.location.href = '/atividades?senha_alterada=true'
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexum-dark">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <IconLock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Alterar Senha</h1>
          <p className="text-white/60 mt-2">Defina sua nova senha para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Nova senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary pr-12"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showSenha ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary pr-12"
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showConfirmar ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !senha || !confirmarSenha}
            className="w-full px-4 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="animate-spin" size={20} />
                Alterando...
              </>
            ) : (
              'Confirmar nova senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
