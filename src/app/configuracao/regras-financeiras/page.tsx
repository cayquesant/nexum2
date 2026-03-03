'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconUsers, IconLoader2, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react'
import { SocioModal } from '@/components/configuracao/SocioModal'

interface Socio {
  id: string
  nome: string
  porcentagem: number
}

export default function SociosPage() {
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [socios, setSocios] = useState<Socio[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany) {
      loadSocios()
    }
  }, [currentCompany])

  const loadSocios = async () => {
    if (!currentCompany) return
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data } = await supabase
        .from('empresa_socios')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('criado_em', { ascending: true })

      if (data) {
        setSocios(data.map((s: any) => ({
          id: s.id,
          nome: s.nome,
          porcentagem: s.porcentagem
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar sócios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (socioData: { nome: string; porcentagem: number }) => {
    if (!currentCompany) return
    setIsSaving(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      if (editingSocio) {
        const { error } = await supabase
          .from('empresa_socios')
          .update({
            nome: socioData.nome,
            porcentagem: socioData.porcentagem
          })
          .eq('id', editingSocio.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Sócio atualizado com sucesso!' })
      } else {
        const { error } = await supabase
          .from('empresa_socios')
          .insert({
            empresa_id: currentCompany.id,
            nome: socioData.nome,
            porcentagem: socioData.porcentagem
          })

        if (error) throw error
        setMessage({ type: 'success', text: 'Sócio adicionado com sucesso!' })
      }

      setShowModal(false)
      setEditingSocio(null)
      loadSocios()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar sócio' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (socioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sócio?')) return

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { error } = await supabase
        .from('empresa_socios')
        .delete()
        .eq('id', socioId)

      if (error) throw error
      setMessage({ type: 'success', text: 'Sócio excluído com sucesso!' })
      loadSocios()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir sócio' })
    }
  }

  const openEditModal = (socio: Socio) => {
    setEditingSocio(socio)
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingSocio(null)
    setShowModal(true)
  }

  const totalPorcentagem = socios.reduce((sum, s) => sum + s.porcentagem, 0)
  const isTotalValid = Math.abs(totalPorcentagem - 100) < 0.01

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
            <IconUsers size={22} />
            Sócios da Empresa
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os sócios e suas participações</p>
        </div>
        {canCreateEdit && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <IconPlus size={18} />
            Adicionar Sócio
          </button>
        )}
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        {socios.length > 0 ? (
          <div className="space-y-3">
            {socios.map((socio) => (
              <div key={socio.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-nexum-primary to-nexum-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {socio.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{socio.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-nexum-primary font-semibold">{socio.porcentagem}%</p>
                  <p className="text-white/40 text-xs">participação</p>
                </div>
                {canCreateEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(socio)}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(socio.id)}
                      className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-center py-8">Nenhum sócio cadastrado</p>
        )}

        <div className={`mt-6 p-4 rounded-xl border ${isTotalValid ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Total das Participações</p>
              {!isTotalValid && socios.length > 0 && (
                <p className="text-yellow-400 text-sm">A soma não é igual a 100%</p>
              )}
            </div>
            <p className={`text-2xl font-bold ${isTotalValid ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalPorcentagem.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout activeMenu="configuracao" configSubmenuOpen={true}>
      {pageContent}
      <SocioModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingSocio(null) }}
        onSave={handleSave}
        socio={editingSocio}
        isSaving={isSaving}
      />
    </DashboardLayout>
  )
}
