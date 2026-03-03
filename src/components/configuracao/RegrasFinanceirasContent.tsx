'use client'

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { IconCoin, IconLoader2, IconCalendar, IconPercentage, IconClock } from '@tabler/icons-react'

export function RegrasFinanceirasContent() {
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [formData, setFormData] = useState({
    dia_vencimento: 5,
    multa_atraso: 2.0,
    juros_mensal: 1.0,
    desconto_antecipado: 5.0,
    dias_tolerancia: 3
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (currentCompany) {
      loadConfiguracoes()
    }
  }, [currentCompany])

  const loadConfiguracoes = async () => {
    if (!currentCompany) return
    setIsLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('empresa_configuracoes')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .single()

      if (data) {
        setFormData({
          dia_vencimento: data.dia_vencimento || 5,
          multa_atraso: data.multa_atraso || 2.0,
          juros_mensal: data.juros_mensal || 1.0,
          desconto_antecipado: data.desconto_antecipado || 5.0,
          dias_tolerancia: data.dias_tolerancia || 3
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCompany) return
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const { data: existingConfig } = await supabase
        .from('empresa_configuracoes')
        .select('id')
        .eq('empresa_id', currentCompany.id)
        .single()

      if (existingConfig) {
        const { error } = await supabase
          .from('empresa_configuracoes')
          .update({
            dia_vencimento: formData.dia_vencimento,
            multa_atraso: formData.multa_atraso,
            juros_mensal: formData.juros_mensal,
            desconto_antecipado: formData.desconto_antecipado,
            dias_tolerancia: formData.dias_tolerancia,
            atualizado_em: new Date().toISOString()
          })
          .eq('empresa_id', currentCompany.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('empresa_configuracoes')
          .insert({
            empresa_id: currentCompany.id,
            dia_vencimento: formData.dia_vencimento,
            multa_atraso: formData.multa_atraso,
            juros_mensal: formData.juros_mensal,
            desconto_antecipado: formData.desconto_antecipado,
            dias_tolerancia: formData.dias_tolerancia
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Regras financeiras salvas com sucesso!' })
      loadConfiguracoes()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para configurar</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IconCoin size={22} />
          Regras Financeiras
        </h3>
        <p className="text-white/60 text-sm mt-1">Configure as regras de cobranca e pagamentos</p>
      </div>

      {message.text && (
        <div className={`glass-card p-4 border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <IconCalendar size={18} className="text-nexum-primary" />
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dia_vencimento}
                onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) || 1 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                disabled={!canCreateEdit}
              />
              <p className="text-white/40 text-sm mt-1">Dia do mes para vencimento das cobrancas (1-31)</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <IconClock size={18} className="text-nexum-primary" />
                Dias de Tolerancia
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.dias_tolerancia}
                onChange={(e) => setFormData({ ...formData, dias_tolerancia: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                disabled={!canCreateEdit}
              />
              <p className="text-white/40 text-sm mt-1">Dias apos vencimento antes de aplicar multa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <IconPercentage size={18} className="text-nexum-primary" />
                Multa por Atraso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.multa_atraso}
                onChange={(e) => setFormData({ ...formData, multa_atraso: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                disabled={!canCreateEdit}
              />
              <p className="text-white/40 text-sm mt-1">Percentual de multa apos vencimento</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <IconPercentage size={18} className="text-nexum-primary" />
                Juros Mensal (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.juros_mensal}
                onChange={(e) => setFormData({ ...formData, juros_mensal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                disabled={!canCreateEdit}
              />
              <p className="text-white/40 text-sm mt-1">Taxa de juros ao mes apos vencimento</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <IconPercentage size={18} className="text-nexum-primary" />
                Desconto Antecipado (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.desconto_antecipado}
                onChange={(e) => setFormData({ ...formData, desconto_antecipado: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
                disabled={!canCreateEdit}
              />
              <p className="text-white/40 text-sm mt-1">Desconto para pagamento antecipado</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white font-medium mb-3">Resumo das Regras</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-white/60">Vencimento</p>
                <p className="text-nexum-primary font-semibold">Dia {formData.dia_vencimento}</p>
              </div>
              <div>
                <p className="text-white/60">Tolerancia</p>
                <p className="text-nexum-primary font-semibold">{formData.dias_tolerancia} dias</p>
              </div>
              <div>
                <p className="text-white/60">Multa</p>
                <p className="text-nexum-primary font-semibold">{formData.multa_atraso}%</p>
              </div>
              <div>
                <p className="text-white/60">Juros</p>
                <p className="text-nexum-primary font-semibold">{formData.juros_mensal}%/mes</p>
              </div>
              <div>
                <p className="text-white/60">Desconto</p>
                <p className="text-nexum-primary font-semibold">{formData.desconto_antecipado}%</p>
              </div>
            </div>
          </div>
        </div>

        {canCreateEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
