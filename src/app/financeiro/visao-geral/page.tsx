'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { IconTrendingUp, IconTrendingDown, IconDollarSign, IconPieChart, IconCalendar, IconUsers, IconTrendingUpRight } from '@tabler/icons-react'
import { useCompanyStore } from '@/store'

export default function VisaoGeralPage() {
  const { currentCompany } = useCompanyStore()

  if (!currentCompany) {
    return (
      <DashboardLayout activeMenu="financeiro">
        <div className="glass-card p-8 text-center">
          <p className="text-white/60">Selecione uma empresa para visualizar o financeiro</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeMenu="financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Visão Geral</h2>
          <p className="text-white/60 text-sm">KPIs de faturamento e performance financeira da empresa</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Faturamento Mensal */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <IconDollarSign size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Faturamento Mensal</h3>
                <div className="flex items-center gap-2">
                  <IconTrendingUp size={16} className="text-green-400" />
                  <span className="text-2xl font-bold text-green-400">R$ 0,00</span>
                  <span className="text-green-400 text-sm">+12.5%</span>
                </div>
                <p className="text-white/60 text-sm">Mês atual (Março 2026)</p>
              </div>
            </div>
          </div>

          {/* MRR */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <IconUsers size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">MRR Total</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">R$ 45.000,00</span>
                </div>
                <p className="text-white/60 text-sm">Receita mensal recorrente de todos os clientes</p>
              </div>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <IconTrendingUpRight size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Lucro Líquido Real</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">R$ 28.500,00</span>
                  <span className="text-purple-400 text-sm">Meta: R$ 35.000,00</span>
                </div>
                <div className="w-full bg-white/10 rounded-lg h-2 mt-3">
                  <div className="h-full bg-purple-500/50 rounded-lg flex items-center">
                    <span className="text-sm font-semibold text-white">81%</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-2">Lucro real após despesas fixas e variáveis</p>
              </div>
            </div>
          </div>

          {/* Margem Real */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <IconTrendingDown size={24} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Margem Real Média</h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">18,5%</span>
                </div>
                <p className="text-white/60 text-sm">Margem de lucro sobre receita bruta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Faturamento */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Faturamento Mensal (Últimos 12 meses)</h3>
            <div className="h-64 bg-white/5 rounded-lg"></div>
            <p className="text-white/40 text-sm text-center mt-4">Gráfico em desenvolvimento</p>
          </div>

          {/* Gráfico de Receita vs Despesa */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Receita vs Despesa (Últimos 12 meses)</h3>
            <div className="h-64 bg-white/5 rounded-lg"></div>
            <p className="text-white/40 text-sm text-center mt-4">Gráfico em desenvolvimento</p>
          </div>
        </div>

        {/* Detalhamento por Cliente */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Faturamento por Cliente</h3>
          <p className="text-white/60 text-sm mb-4">Top 5 clientes com maior faturamento</p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">1º</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">InovaWeb</h4>
                    <p className="text-white/60 text-sm">MRR: R$ 15.000,00</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-400">R$ 15.000,00</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">2º</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Cliente Exemplo</h4>
                    <p className="text-white/60 text-sm">MRR: R$ 8.500,00</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-white">R$ 8.500,00</span>
              </div>
            </div>
            <p className="text-white/40 text-xs text-center mt-4">Dados ilustrativos - aguardando implementação de dashboard real</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
