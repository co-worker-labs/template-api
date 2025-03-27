import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClientInfo } from '../client-info/client-info';
import { str2Object } from '../fns';

@Injectable()
export class ClientInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const clientStr = request.headers['x-client'];
    if (clientStr) {
      const client = str2Object(clientStr) as ClientInfo;
      client.appVersion = client.appVersion || 1;
      client.platformType = client.platformType || 2;
      client.deviceId = client.deviceId || undefined;
      request.clientInfo = client;
    }
    return next.handle();
  }
}
