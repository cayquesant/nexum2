'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'

export default function LancamentosPage() {
  return (
    <DashboardLayout activeMenu="financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Lançamentos</h2>
          <p className="text-white/60 text-sm">Registro de receitas, despesas e movimentações financeiras</p>
        </div>

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Novo Lançamento */}
          <div className="glass-card p-6 border-2 border-nexum-primary/30 cursor-pointer hover:border-nexum-primary/50 transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-nexum-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">+</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Novo Lançamento</h3>
                <p className="text-white/60 text-sm">Criar nova entrada ou saída</p>
              </div>
            </div>
          </div>

          {/* Lançamentos Recentes */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lançamentos Recentes</h3>
            <p className="text-white/40 text-xs text-center mt-8">Dados ilustrativos - aguardando implementação de dashboard real</p>
          </div>

          {/* Filtros Rápidos */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Filtros Rápidos</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-medium text-white">Tipo: Todos</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-medium text-white">Tipo: Receitas</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-medium text-white">Tipo: Despesas</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-medium text-white">Tipo: Transferências</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
