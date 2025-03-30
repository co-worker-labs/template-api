import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisService } from '../redis-manager/redis-manager.service';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { LocalKeyService } from './local-key.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (redisService: RedisService) => {
        return {
          stores: redisService.getKeyvClient(),
        };
      },
      inject: [RedisService],
      imports: [RedisManagerModule],
    }),
  ],
  providers: [CacheService, LocalKeyService],
  exports: [CacheService],
})
export class CacheManagerModule {}
