import { SetMetadata } from '@nestjs/common';

import type { AuthUserRole } from '../auth-user.type';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AuthUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
