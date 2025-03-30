import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { jsonStringifyReplacer } from '../fns';
import { Errs } from '../error-codes';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((res) => this.responseHandler(res, context)));
  }

  responseHandler(res: any, context: ExecutionContext) {
    return JSON.stringify(
      {
        reqId: context.switchToHttp().getRequest().id,
        code: Errs.SUCCESS.code,
        msg: 'success',
        ts: Date.now(),
        data: res,
      },
      jsonStringifyReplacer,
    );
  }
}
