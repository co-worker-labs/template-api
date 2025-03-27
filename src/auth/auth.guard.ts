import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { LoginUser } from './login-user';
import { ALLOW_ANON_KEY } from './allow_anon.decorator';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../common/env-keys.enum';
import { UnauthorizedException } from '../common/exception/exception';
import * as crypto from 'node:crypto';
import * as jwks from 'jwks-rsa';
import * as process from 'node:process';
import { Errs } from '../common/error-codes';

const AUTH_HEADER = 'authorization';
const re = /(\S+)\s+(\S+)/;

interface VerifyRes {
  user?: LoginUser;
  error?: Error;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly client: jwks.JwksClient;
  private readonly publicKeyMap = new Map<string, crypto.KeyObject>();
  private readonly mockEnabled = process.env.AUTH_MOCK === 'true';

  constructor(
    private reflector: Reflector,
    configService: ConfigService,
  ) {
    const jwksUri = configService.get(EnvKeys.JWKS_URI);
    if (!jwksUri) {
      throw new Error(`Missing ${EnvKeys.JWKS_URI}`);
    }
    this.client = jwks({ jwksUri } as jwks.Options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowAnon = this.reflector.getAllAndOverride<number>(ALLOW_ANON_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    let tryAuth = false;
    if (allowAnon) {
      if (allowAnon === 2) {
        tryAuth = true;
      } else {
        return true;
      }
    }

    const request = context.switchToHttp().getRequest();

    const result = await this.verifyJwt(context);
    if (tryAuth) {
      request.user = result?.user;
      return true;
    }
    if (!result) {
      throw new UnauthorizedException(Errs.MISSING_TOKEN);
    }
    const { user, error } = result;
    if (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(Errs.EXPIRED_TOKEN);
      }
      throw new UnauthorizedException(Errs.INVALID_TOKEN);
    }
    if (!user) {
      throw new UnauthorizedException(Errs.INVALID_TOKEN);
    }
    request.user = user;
    return true;
  }

  private async verifyJwt(context: ExecutionContext): Promise<VerifyRes> {
    if (this.mockEnabled) {
      return this.verifyJwtOnlyDecode(context);
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers[AUTH_HEADER];
    if (authHeader) {
      const matches = authHeader.match(re);
      if (matches) {
        try {
          const token = matches[2];
          const kid = jwt.decode(token, { complete: true })?.header?.kid;
          if (!kid) {
            return {
              error: new UnauthorizedException(Errs.INVALID_TOKEN),
            };
          }
          let publicKey = this.publicKeyMap.get(kid);
          if (!publicKey) {
            const key = await this.client
              .getSigningKey(kid)
              .catch((err: Error) => {
                this.logger.error({ err });
                throw new Error('Error to get public key');
              });
            if (!key) {
              this.logger.error(`The token key is not found, kid: ${kid}`);
              return {
                error: new UnauthorizedException(Errs.INVALID_TOKEN),
              };
            }
            publicKey = crypto.createPublicKey({
              key: key.getPublicKey(),
              format: 'pem',
            });
            this.publicKeyMap.set(kid, publicKey);
          }

          const payload = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
          });
          if (payload) {
            const user = {
              id: payload['userId'],
              username: payload['preferred_username'],
            };
            return {
              user,
            };
          }
        } catch (e) {
          return {
            error: e,
          };
        }
      }
    }
    return null;
  }

  private async verifyJwtOnlyDecode(
    context: ExecutionContext,
  ): Promise<VerifyRes> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers[AUTH_HEADER];
    if (authHeader) {
      const matches = authHeader.match(re);
      if (matches) {
        try {
          const token = matches[2];
          const payload = jwt.decode(token, { complete: true })?.payload;
          if (!payload) {
            return {
              error: new UnauthorizedException(Errs.INVALID_TOKEN),
            };
          }
          const user = {
            id: payload['userId'],
            username: payload['preferred_username'],
          };
          return {
            user,
          };
        } catch (e) {
          return {
            error: e,
          };
        }
      }
    }
    return null;
  }
}
