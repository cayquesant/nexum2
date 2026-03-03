'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { IconBrain } from '@tabler/icons-react'

export default function IAAutomacaoPage() {
  const pageContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <IconBrain size={22} />
          IA & Automacao
        </h3>
        <p className="text-white/60 text-sm mt-1">Configuracoes de inteligencia artificial e automacoes</p>
      </div>

      <div className="glass-card p-12 text-center">
        <div className="w-20 h-20 bg-nexum-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <IconBrain size={40} className="text-nexum-primary" />
        </div>
        <h4 className="text-xl font-semibold text-white mb-2">Em Desenvolvimento</h4>
        <p className="text-white/60 max-w-md mx-auto">
          Esta funcionalidade esta sendo desenvolvida e estara disponivel em breve.
        </p>
      </div>
    </div>
  )

  return (
    <DashboardLayout activeMenu="configuracao" configSubmenuOpen={true}>
      {pageContent}
    </DashboardLayout>
  )
}
