'use client'

import { useState } from 'react'
import { useCompanyStore, useAuthStore } from '@/store'
import { isSuperAdmin } from '@/types'
import { Building2, ChevronDown, Check, X } from 'lucide-react'

interface CompanySelectorProps {
  onSelect?: (companyId: string) => void
}

export function CompanySelector({ onSelect }: CompanySelectorProps) {
  const { user } = useAuthStore()
  const { companies, currentCompany, setCompany } = useCompanyStore()
  const [isOpen, setIsOpen] = useState(false)

  const userIsSuperAdmin = user ? isSuperAdmin(user.role) : false

  if (!userIsSuperAdmin || companies.length === 0) {
    return null
  }

  const handleSelect = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (company) {
      setCompany(company)
      setIsOpen(false)
      onSelect?.(companyId)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 transition-all"
      >
        <Building2 size={16} />
        <span className="hidden md:inline text-sm max-w-[150px] truncate">
          {currentCompany?.name || 'Selecionar empresa'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 glass-card p-2 z-50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
              <span className="text-white/60 text-sm">Empresas</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    currentCompany?.id === company.id
                      ? 'bg-nexum-primary/20 text-white'
                      : 'hover:bg-white/5 text-white/80'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {currentCompany?.id === company.id && (
                      <Check size={16} className="text-nexum-primary" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{company.name}</p>
                    <p className="text-white/40 text-xs">{company.shortId}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    company.status === 'active' 
                      ? 'bg-green-500/20 text-green-400'
                      : company.status === 'inactive'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {company.status === 'active' ? 'Ativa' : 
                     company.status === 'inactive' ? 'Inativa' : 'Suspensa'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
