import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { jsonStringifyReplacer } from '../fns';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((res) => this.responseHandler(res, context)));
  }

  responseHandler(res: any, context: ExecutionContext) {
    return JSON.stringify(
      {
        requestId: context.switchToHttp().getRequest().id,
        code: 0,
        message: 'success',
        ts: Date.now(),
        data: res,
      },
      jsonStringifyReplacer,
    );
  }
}
