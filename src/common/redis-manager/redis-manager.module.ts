import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis-manager.service';
import { RedisKeyService } from './redis-key.service';

@Global()
@Module({
  providers: [RedisService, RedisKeyService],
  exports: [RedisService, RedisKeyService],
})
export class RedisManagerModule {}
