import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../auth-user.type';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator<
  keyof AuthenticatedUser | undefined
>((property, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  const user = request.user;

  if (!user) {
    return undefined;
  }

  return property ? user[property] : user;
});
