'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Cliente, STATUS_CLIENTE } from '@/types'
import { ClienteCard } from './ClienteCard'
import { ClienteModal } from './ClienteModal'
import { useCompanyStore } from '@/store'
import { usePermissions } from '@/hooks/usePermissions'
import { authFetch } from '@/lib/api-client'
import { IconLoader2, IconPlus, IconSearch, IconUsersGroup, IconFilter } from '@tabler/icons-react'

export function ClienteList() {
  const pathname = usePathname()
  const { currentCompany } = useCompanyStore()
  const { canCreateEdit } = usePermissions()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)

  useEffect(() => {
    if (currentCompany && pathname === '/configuracao/gestao-clientes') {
      loadClientes()
    }
  }, [currentCompany, pathname, statusFilter])

  const loadClientes = async () => {
    if (!currentCompany) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'todos') {
        params.append('status', statusFilter)
      }
      if (search) {
        params.append('busca', search)
      }

      const queryString = params.toString()
      const url = queryString ? `/api/clientes?${queryString}` : '/api/clientes'

      const response = await authFetch(url)
      const result = await response.json()

      if (response.ok) {
        setClientes(result.clientes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadClientes()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const openNewCliente = () => {
    setSelectedClienteId(null)
    setModalOpen(true)
  }

  const openEditCliente = (clienteId: string) => {
    setSelectedClienteId(clienteId)
    setModalOpen(true)
  }

  const handleSave = () => {
    loadClientes()
  }

  if (!currentCompany) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">Selecione uma empresa para gerenciar clientes</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IconUsersGroup size={22} />
            Gestão de Clientes
          </h3>
          <p className="text-white/60 text-sm mt-1">Gerencie os clientes da sua empresa</p>
        </div>

        {canCreateEdit && (
          <button
            onClick={openNewCliente}
            className="px-4 py-2 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <IconPlus size={18} />
            Novo Cliente
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nome..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <IconFilter size={18} className="text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-nexum-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nexum-primary"
          >
            <option value="todos">Todos os status</option>
            {STATUS_CLIENTE.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="animate-spin text-nexum-primary" size={32} />
        </div>
      ) : clientes.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-nexum-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconUsersGroup size={40} className="text-nexum-primary" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">
            {search || statusFilter !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h4>
          <p className="text-white/60 max-w-md mx-auto mb-6">
            {search || statusFilter !== 'todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando seu primeiro cliente para gerenciar seus projetos.'
            }
          </p>
          {canCreateEdit && !search && statusFilter === 'todos' && (
            <button
              onClick={openNewCliente}
              className="px-6 py-3 bg-gradient-to-r from-nexum-primary to-nexum-secondary text-white font-medium rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <IconPlus size={18} />
              Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        /* Client Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onClick={() => openEditCliente(cliente.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ClienteModal
        clienteId={selectedClienteId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
