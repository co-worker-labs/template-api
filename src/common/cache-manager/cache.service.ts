import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisKeyService } from '../redis-manager/redis-key.service';
import QuickLRU from 'quick-lru';
import Keyv from 'keyv';

@Injectable()
export class CacheService {
  private readonly items = new Map<string, Keyv>();

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisKeyService: RedisKeyService,
  ) {}

  manager() {
    return this.cacheManager;
  }

  local(name: string, maxSize?: number): Keyv {
    let value = this.items.get(name);
    if (!value) {
      value = new Keyv({
        store: new QuickLRU({ maxSize: maxSize || 1000 }),
      });
      this.items.set(name, value);
    }
    return value;
  }

  keys() {
    return this.redisKeyService;
  }
}
