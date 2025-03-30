import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';
import { InternalError, UserFacingError } from './exception';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class ExceptionCacheFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: Error, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = -1;
    let msg = exception.message;
    let detail = null;
    let args = null;

    if (exception instanceof UnauthorizedException) {
      status = 401;
      code = 401;
    } else if (exception instanceof ForbiddenException) {
      status = 403;
      code = 403;
    } else if (exception instanceof UserFacingError) {
      status = exception.status;
      code = exception.code;
      args = exception.args;
    } else if (exception instanceof BadRequestException) {
      status = 400;
      code = 400;
      if (exception.getResponse()) {
        const { statusCode, error, message } = exception.getResponse() as any;
        if (statusCode) {
          code = statusCode;
        }
        if (error) {
          msg = error;
        }
        if (message) {
          if (Array.isArray(message)) {
            detail = message[0];
          } else {
            detail = message;
          }
        }
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (exception instanceof InternalError) {
      status = exception.status;
      code = exception.code;
    }

    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const res = {
      rid: request.id,
      code: code === -1 ? status : code,
      msg: this.i18n.t(`errors.${msg}`, { args: args }),
      ts: Date.now(),
    };

    if (detail) {
      res['detail'] = detail;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      request.log.error(exception);
    } else {
      request.log.warn(exception);
    }

    httpAdapter.reply(response, res, status);
  }
}
