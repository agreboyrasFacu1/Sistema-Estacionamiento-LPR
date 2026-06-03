import { describe, expect, it } from 'vitest';
import { User } from '../types';
import { canAccessRole, getRoleLabel, hasPermission } from './permissions';

const cashier: User = {
  id: '1',
  email: 'cashier@example.com',
  name: 'Cashier',
  role: 'cashier',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

const admin: User = {
  ...cashier,
  id: '2',
  email: 'admin@example.com',
  role: 'admin',
};

describe('permissions domain', () => {
  it('grants cashier operational permissions but not admin-only pricing', () => {
    expect(hasPermission(cashier, 'vehicles:entry')).toBe(true);
    expect(hasPermission(cashier, 'admin:pricing')).toBe(false);
  });

  it('grants admin permissions and denies inactive users', () => {
    expect(hasPermission(admin, 'admin:users')).toBe(true);
    expect(hasPermission({ ...admin, isActive: false }, 'admin:users')).toBe(false);
  });

  it('checks role access and labels known roles', () => {
    expect(canAccessRole(admin, ['admin'])).toBe(true);
    expect(canAccessRole(cashier, ['admin'])).toBe(false);
    expect(getRoleLabel('admin')).toBe('Administrador');
    expect(getRoleLabel('cashier')).toBe('Cajero');
  });
});
