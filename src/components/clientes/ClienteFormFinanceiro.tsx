'use client'

import { ClienteFormData, ClienteStatus, STATUS_CLIENTE } from '@/types'
import { IconCurrencyDollar, IconCalendar } from '@tabler/icons-react'

interface ClienteFormFinanceiroProps {
  data: Partial<ClienteFormData>
  onChange: (data: Partial<ClienteFormData>) => void
  disabled?: boolean
}

export function ClienteFormFinanceiro({ data, onChange, disabled = false }: ClienteFormFinanceiroProps) {
  const inputClass = `w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  const formatMRR = (value?: number) => {
    if (!value) return ''
    return value.toString()
  }

  const parseMRR = (value: string) => {
    const parsed = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(parsed) ? undefined : parsed
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Status do Cliente</label>
        <div className="flex gap-2">
          {STATUS_CLIENTE.map((status) => {
            const colors = {
              green: data.status === status.value ? 'bg-green-500/30 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10',
              yellow: data.status === status.value ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10',
              red: data.status === status.value ? 'bg-red-500/30 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }

            return (
              <button
                key={status.value}
                type="button"
                onClick={() => !disabled && onChange({ ...data, status: status.value as ClienteStatus })}
                disabled={disabled}
                className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-all ${colors[status.color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {status.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* MRR */}
      <div>
        <label className="block text-white/60 text-sm mb-2">
          <div className="flex items-center gap-2">
            <IconCurrencyDollar size={16} />
            MRR - Receita Mensal Recorrente
          </div>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">R$</span>
          <input
            type="text"
            value={formatMRR(data.mrr)}
            onChange={(e) => onChange({ ...data, mrr: parseMRR(e.target.value) })}
            disabled={disabled}
            className={`${inputClass} pl-12`}
            placeholder="0,00"
          />
        </div>
        <p className="text-white/40 text-xs mt-1">Valor mensal que o cliente paga</p>
      </div>

      {/* Dia de Vencimento */}
      <div>
        <label className="block text-white/60 text-sm mb-2">
          <div className="flex items-center gap-2">
            <IconCalendar size={16} />
            Dia de Vencimento
          </div>
        </label>
        <select
          value={data.diaVencimento || ''}
          onChange={(e) => onChange({ ...data, diaVencimento: e.target.value ? parseInt(e.target.value) : undefined })}
          disabled={disabled}
          className={`${inputClass.replace('bg-white/5', 'bg-nexum-dark')}`}
        >
          <option value="">Selecione o dia</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
            <option key={dia} value={dia}>
              Dia {dia}
            </option>
          ))}
        </select>
      </div>

      {/* Régua de Cobrança */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Régua de Cobrança</label>
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
          <div>
            <p className="text-white">Participar da régua de cobrança</p>
            <p className="text-white/40 text-xs">Receberá lembretes automáticos de pagamento</p>
          </div>
          <button
            type="button"
            onClick={() => !disabled && onChange({ ...data, participaReguaCobranca: !data.participaReguaCobranca })}
            disabled={disabled}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              data.participaReguaCobranca ? 'bg-green-500' : 'bg-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                data.participaReguaCobranca ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
