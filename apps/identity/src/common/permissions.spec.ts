import { describe, expect, it } from 'vitest';
import { permissionsForRoles } from './permissions';

describe('role permissions', () => {
  it('grants every platform permission to super administrators', () => {
    const permissions = permissionsForRoles(['SUPER_ADMIN']);
    expect(permissions).toContain('admin.users.manage');
    expect(permissions).toContain('catalogue.product.publish');
    expect(permissions).toContain('platform.roles.manage');
  });

  it('does not grant administrative permissions to customers or sellers', () => {
    expect(permissionsForRoles(['CUSTOMER'])).not.toContain('admin.users.read');
    const seller = permissionsForRoles(['SELLER']);
    expect(seller).toContain('catalogue.product.manage');
    expect(seller).not.toContain('admin.users.read');
    expect(seller).not.toContain('order.read.all');
  });

  it('combines permissions from multiple roles', () => {
    const permissions = permissionsForRoles(['CUSTOMER', 'SELLER']);
    expect(permissions).toContain('order.place');
    expect(permissions).toContain('inventory.adjust.own');
  });
});
