import type { RoleName } from '@prisma/client';

export const ROLE_PERMISSIONS = {
  'auth.profile.read': [
    'CUSTOMER',
    'SELLER',
    'DELIVERY_PARTNER',
    'ADMIN',
    'SUPER_ADMIN',
  ],
  'auth.profile.update': [
    'CUSTOMER',
    'SELLER',
    'DELIVERY_PARTNER',
    'ADMIN',
    'SUPER_ADMIN',
  ],
  'auth.sessions.manage': [
    'CUSTOMER',
    'SELLER',
    'DELIVERY_PARTNER',
    'ADMIN',
    'SUPER_ADMIN',
  ],
  'notifications.preferences.manage': ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN'],
  'seller.application.submit': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  'seller.application.read.own': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  'seller.application.review': ['ADMIN', 'SUPER_ADMIN'],
  'storefront.update': ['SELLER', 'SUPER_ADMIN'],
  'storefront.pause': ['SELLER', 'SUPER_ADMIN'],
  'catalogue.product.manage': ['SELLER', 'SUPER_ADMIN'],
  'catalogue.product.publish': ['SELLER', 'SUPER_ADMIN'],
  'catalogue.moderation.review': ['ADMIN', 'SUPER_ADMIN'],
  'inventory.read.own': ['SELLER', 'SUPER_ADMIN'],
  'inventory.adjust.own': ['SELLER', 'SUPER_ADMIN'],
  'inventory.read.all': ['ADMIN', 'SUPER_ADMIN'],
  'order.place': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  'order.read.own': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  'order.process.seller': ['SELLER', 'SUPER_ADMIN'],
  'order.read.all': ['ADMIN', 'SUPER_ADMIN'],
  'payment.read.own': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'],
  'payment.refund.request': ['ADMIN', 'SUPER_ADMIN'],
  'payment.read.all': ['ADMIN', 'SUPER_ADMIN'],
  'fulfilment.update.assigned': ['DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN'],
  'fulfilment.manage.seller': ['SELLER', 'SUPER_ADMIN'],
  'fulfilment.read.all': ['ADMIN', 'SUPER_ADMIN'],
  'seller.analytics.read.own': ['SELLER', 'SUPER_ADMIN'],
  'admin.users.read': ['ADMIN', 'SUPER_ADMIN'],
  'admin.users.manage': ['SUPER_ADMIN'],
  'admin.audit.read': ['ADMIN', 'SUPER_ADMIN'],
  'admin.settings.manage': ['SUPER_ADMIN'],
  'admin.analytics.read': ['ADMIN', 'SUPER_ADMIN'],
  'platform.roles.manage': ['SUPER_ADMIN'],
} as const satisfies Record<string, readonly RoleName[]>;

export type Permission = keyof typeof ROLE_PERMISSIONS;

const ALL_PERMISSIONS = Object.keys(ROLE_PERMISSIONS) as Permission[];

export function permissionsForRoles(roles: readonly RoleName[]): Permission[] {
  if (roles.includes('SUPER_ADMIN')) {
    return ALL_PERMISSIONS;
  }
  const granted = new Set<Permission>();
  for (const permission of ALL_PERMISSIONS) {
    if (ROLE_PERMISSIONS[permission].some((role) => roles.includes(role))) {
      granted.add(permission);
    }
  }
  return [...granted];
}
