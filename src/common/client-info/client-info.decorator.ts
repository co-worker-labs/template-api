import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientInfo } from './client-info';

export const CurrentClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.clientInfo as ClientInfo;
  },
);
