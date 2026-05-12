import { User, UserRole } from '../types';

export type Permission =
  | 'dashboard:view'
  | 'vehicles:entry'
  | 'vehicles:exit'
  | 'vehicles:search'
  | 'subscribers:manage'
  | 'admin:pricing'
  | 'admin:users';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  cashier: [
    'dashboard:view',
    'vehicles:entry',
    'vehicles:exit',
    'vehicles:search',
    'subscribers:manage',
  ],
  admin: [
    'dashboard:view',
    'vehicles:entry',
    'vehicles:exit',
    'vehicles:search',
    'subscribers:manage',
    'admin:pricing',
    'admin:users',
  ],
};

export const hasPermission = (
  user: User | null,
  permission: Permission
): boolean => {
  if (!user || !user.isActive) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
};

export const canAccessRole = (
  user: User | null,
  allowedRoles: UserRole[] = ['cashier', 'admin']
): boolean => !!user && user.isActive && allowedRoles.includes(user.role);

export const getRoleLabel = (role: UserRole | string): string =>
  role === 'admin' ? 'Administrador' : 'Cajero';
