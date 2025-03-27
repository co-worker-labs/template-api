import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import * as path from 'node:path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EnvKeys } from './common/env-keys.enum';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoOption } from './common/pino';
import { RedisManagerModule } from './common/redis-manager/redis-manager.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { SignatureModule } from './signature/signature.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationOptions: {
        allowUnknown: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: buildPinoOption(),
    }),
    HttpModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const timeout = configService.get<number>(EnvKeys.HTTP_TIMEOUT) || 3000;
        const maxRedirects =
          configService.get<number>(EnvKeys.HTTP_MAX_RETRIES) || 3;
        return {
          timeout,
          maxRedirects,
        };
      },
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage:
          configService.get<string>(EnvKeys.FALLBACK_LANGUAGE) || 'en',
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
      logging: true,
    }),
    ScheduleModule.forRoot(),
    RedisManagerModule,
    PrismaModule,
    HealthModule,
    SignatureModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
