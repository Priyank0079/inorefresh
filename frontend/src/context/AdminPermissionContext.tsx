import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type AdminRole = 'Admin' | 'Super Admin' | 'Investor' | 'Staff';

export type AdminModule =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'customers'
  | 'delivery'
  | 'warehouse'
  | 'port'
  | 'finance'
  | 'marketing'
  | 'returns'
  | 'notifications'
  | 'settings'
  | 'team';

export const ALL_MODULES: AdminModule[] = [
  'dashboard',
  'products',
  'orders',
  'customers',
  'delivery',
  'warehouse',
  'port',
  'finance',
  'marketing',
  'returns',
  'notifications',
  'settings',
];

export const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard:     'Dashboard',
  products:      'Products & Catalog',
  orders:        'Orders',
  customers:     'Customers',
  delivery:      'Delivery',
  warehouse:     'Warehouse',
  port:          'Port',
  finance:       'Finance & Payments',
  marketing:     'Marketing',
  returns:       'Returns & Refunds',
  notifications: 'Notifications',
  settings:      'Settings',
  team:          'Team Management',
};

export interface AdminPermissionContextType {
  role: AdminRole;
  isAdmin: boolean;
  isInvestor: boolean;
  isStaff: boolean;
  isFullAccess: boolean;
  canView: (module: AdminModule) => boolean;
  canWrite: (module: AdminModule) => boolean;
  viewModules: AdminModule[];
  writeModules: AdminModule[];
}

const AdminPermissionContext = createContext<AdminPermissionContextType | undefined>(undefined);

export function AdminPermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<AdminPermissionContextType>(() => {
    const role: AdminRole = (user?.role as AdminRole) ?? 'Admin';
    const isAdmin = role === 'Admin' || role === 'Super Admin';
    const isInvestor = role === 'Investor';
    const isStaff = role === 'Staff';
    const isFullAccess = isAdmin;

    const viewModules: AdminModule[] = isFullAccess || isInvestor
      ? [...ALL_MODULES, 'team']
      : (user?.viewModules ?? []) as AdminModule[];

    const writeModules: AdminModule[] = isAdmin
      ? [...ALL_MODULES, 'team']
      : isInvestor
      ? []
      : (user?.writeModules ?? []) as AdminModule[];

    function canView(module: AdminModule): boolean {
      if (isFullAccess || isInvestor) return true;
      if (isStaff) return viewModules.includes(module);
      return false;
    }

    function canWrite(module: AdminModule): boolean {
      if (isAdmin) return true;
      if (isInvestor) return false;
      if (isStaff) return writeModules.includes(module);
      return false;
    }

    return {
      role,
      isAdmin,
      isInvestor,
      isStaff,
      isFullAccess,
      canView,
      canWrite,
      viewModules,
      writeModules,
    };
  }, [user?.role, user?.viewModules, user?.writeModules]);

  return (
    <AdminPermissionContext.Provider value={value}>
      {children}
    </AdminPermissionContext.Provider>
  );
}

export function useAdminPermission(): AdminPermissionContextType {
  const ctx = useContext(AdminPermissionContext);
  if (!ctx) throw new Error('useAdminPermission must be used inside AdminPermissionProvider');
  return ctx;
}
