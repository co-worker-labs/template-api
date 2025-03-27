import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANON_KEY = 'isPublic';
export const AllowAnon = (tryAuth = false) =>
  SetMetadata(ALLOW_ANON_KEY, tryAuth ? 2 : 1);
