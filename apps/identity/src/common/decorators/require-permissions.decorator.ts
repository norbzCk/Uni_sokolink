import type { Permission } from '../permissions';

export const REQUIRED_PERMISSIONS_KEY = 'sokolink:requiredPermissions';

type DecoratorTarget = object;
type DecoratorFunction = (
  target: DecoratorTarget,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => void;

export function RequirePermissions(...permissions: Permission[]): DecoratorFunction {
  return (target, propertyKey, descriptor) => {
    const metadataTarget = descriptor?.value ?? (propertyKey ? undefined : target);
    if (metadataTarget !== undefined) {
      Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, permissions, metadataTarget);
    }
  };
}
