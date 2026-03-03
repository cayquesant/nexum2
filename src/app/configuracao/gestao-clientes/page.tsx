'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { ClienteList } from '@/components/clientes/ClienteList'

export default function GestaoClientesPage() {
  return (
    <DashboardLayout activeMenu="configuracao" >
      <ClienteList />
    </DashboardLayout>
  )
}
