'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconBuilding, IconLoader2 } from '@tabler/icons-react'

export default function EmpresaPage() {
  const pathname = usePathname()
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    whatsapp: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/empresa') {
      loadCompanyData()
    }
  }, [currentCompany, pathname])

  const loadCompanyData = async () => {
    if (!currentCompany) return
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', currentCompany.id)
        .single()

      if (data) {
        setFormData({
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          email: data.email || '',
          whatsapp: data.whatsapp || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const handleSave = async () => {
    if (!currentCompany) return
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { error } = await supabase
        .from('empresas')
        .update({
          nome: formData.nome,
          cnpj: formData.cnpj || null,
          email: formData.email || null,
          whatsapp: formData.whatsapp || null,
        })
        .eq('id', currentCompany.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Dados salvos com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar dados' })
    } finally {
      setIsSaving(false)
    }
  }

  const pageContent = !currentCompany ? (
    <div className="glass-card p-8 text-center">
      <p className="text-white/60">Selecione uma empresa para configurar</p>
    </div>
  ) : isLoading ? (
    <div className="flex items-center justify-center py-12">
      <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IconBuilding size={22} />
            Dados da Empresa
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie as informacoes da sua empresa</p>
        </div>
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-white/60 text-sm mb-2">Nome da Empresa</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              disabled={!canCreateEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">CNPJ</label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
              disabled={!canCreateEdit}
              placeholder="00.000.000/0000-00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })}
              disabled={!canCreateEdit}
              placeholder="(00) 00000-0000"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white/60 text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!canCreateEdit}
              placeholder="empresa@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary disabled:opacity-50"
            />
          </div>
        </div>

        {canCreateEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <DashboardLayout activeMenu="configuracao" >
      {pageContent}
    </DashboardLayout>
  )
}
