import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as process from 'node:process';
import { genUUID } from './common/fns';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ClientInfoInterceptor } from './common/interceptor/client-info.interceptor';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { HttpService } from '@nestjs/axios';
import { setupAxios } from './common/axios';
import { buildPinoOption } from './common/pino';
import { EnvKeys } from './common/env-keys.enum';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { ExceptionCacheFilter } from './common/exception/exception-cache.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: buildPinoOption(),
      requestIdHeader: 'x-request-id',
      genReqId: () => genUUID(),
    }),
    {
      bufferLogs: true,
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      stopAtFirstError: true,
    }),
  );

  app.useLogger(app.get(Logger));

  app.useGlobalInterceptors(
    new ClientInfoInterceptor(),
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const httpService = app.get(HttpService);
  setupAxios(httpService.axiosRef);

  const httpAdapter = app.get(HttpAdapterHost);
  const i18nService = app.get(I18nService);
  app.useGlobalFilters(
    new ExceptionCacheFilter(httpAdapter, i18nService as any),
  );

  const config = app.get(ConfigService);
  const contextPath = config.get<string>(EnvKeys.CONTEXT_PATH);
  if (contextPath) {
    app.setGlobalPrefix(contextPath);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  // 捕获 SIGINT 和 SIGTERM 信号
  const gracefulShutdown = () => {
    console.log(`Received shutdown signal, closing HTTP server...`);
    // 调用close方法会处理完目前已有的链接
    app.flushLogs();
    app.close();
    process.exit(0);
  };
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

bootstrap();
