import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const payload = {};
    if (request.user) {
      payload['user'] = request.user;
    }
    if (request.body) {
      payload['body'] = request.body;
    }
    if (request.clientInfo) {
      payload['clientInfo'] = request.clientInfo;
    }
    if (Object.keys(payload).length > 0) {
      this.logger.log(payload);
    }
    return next.handle();
  }
}
