import { useAuthStore, useCompanyStore } from '@/store'
import { UserRole, isSuperAdmin, canCreateEdit, isReadOnly } from '@/types'

export function usePermissions() {
  const { user } = useAuthStore()

  const role: UserRole | null = user?.role || null

  return {
    role,
    isSuperAdmin: role ? isSuperAdmin(role) : false,
    canCreateEdit: role ? canCreateEdit(role) : false,
    isReadOnly: role ? isReadOnly(role) : false,
    isAuthenticated: !!user,
    user,
  }
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isAuthenticated } = useAuthStore()

  const hasAccess = !allowedRoles || (user && allowedRoles.includes(user.role))

  return {
    isAuthenticated,
    hasAccess: isAuthenticated && hasAccess,
    user,
  }
}

export function useCompanyContext() {
  const { currentCompany, companies, setCompany } = useCompanyStore()
  
  return {
    currentCompany,
    companies,
    setCompany,
    hasActiveCompany: !!currentCompany,
  }
}
