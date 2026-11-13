export const IS_PUBLIC_KEY = 'sokolink:isPublic';

type DecoratorTarget = object;
type DecoratorFunction = (
  target: DecoratorTarget,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => void;

export function Public(): DecoratorFunction {
  return (target, propertyKey, descriptor) => {
    const metadataTarget = descriptor?.value ?? (propertyKey ? undefined : target);
    if (metadataTarget !== undefined) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, metadataTarget);
    }
  };
}
