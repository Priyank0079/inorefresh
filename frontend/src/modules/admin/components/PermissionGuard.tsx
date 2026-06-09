import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminPermission, AdminModule } from '../../../context/AdminPermissionContext';

interface PermissionGuardProps {
  module: AdminModule;
  children: ReactNode;
}

export default function PermissionGuard({ module, children }: PermissionGuardProps) {
  const { canView } = useAdminPermission();

  if (!canView(module)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
