'use client'

import { ClienteFormData } from '@/types'

interface ClienteFormDadosProps {
  data: Partial<ClienteFormData>
  onChange: (data: Partial<ClienteFormData>) => void
  disabled?: boolean
}

export function ClienteFormDados({ data, onChange, disabled = false }: ClienteFormDadosProps) {
  const inputClass = `w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexum-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/60 text-sm mb-2">
          Nome do Cliente <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.nome || ''}
          onChange={(e) => onChange({ ...data, nome: e.target.value })}
          disabled={disabled}
          className={inputClass}
          placeholder="Nome da empresa ou cliente"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-sm mb-2">Email</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Telefone</label>
          <input
            type="text"
            value={data.telefone || ''}
            onChange={(e) => onChange({ ...data, telefone: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-sm mb-2">Website</label>
          <input
            type="text"
            value={data.website || ''}
            onChange={(e) => onChange({ ...data, website: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="www.exemplo.com"
          />
        </div>

        <div>
          <label className="block text-white/60 text-sm mb-2">Instagram</label>
          <input
            type="text"
            value={data.instagram || ''}
            onChange={(e) => onChange({ ...data, instagram: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="@usuario"
          />
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-sm mb-2">Briefing</label>
        <textarea
          value={data.briefing || ''}
          onChange={(e) => onChange({ ...data, briefing: e.target.value })}
          disabled={disabled}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="Informações importantes sobre o cliente..."
        />
      </div>
    </div>
  )
}
