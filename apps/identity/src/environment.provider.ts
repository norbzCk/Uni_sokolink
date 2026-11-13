import type { Provider } from '@nestjs/common';
import { loadEnvironment, type IdentityEnvironment } from './environment';

export const IDENTITY_ENVIRONMENT = Symbol('IDENTITY_ENVIRONMENT');

export const identityEnvironmentProvider: Provider = {
  provide: IDENTITY_ENVIRONMENT,
  useFactory: (): IdentityEnvironment => loadEnvironment(),
};
