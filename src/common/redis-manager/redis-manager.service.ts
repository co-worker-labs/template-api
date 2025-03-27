import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster as RedisCluster } from 'ioredis';
import { EnvKeys } from '../env-keys.enum';
import Redlock, { ResourceLockedError } from 'redlock';
import { RedisKeyService } from './redis-key.service';

class WrappedValue {
  value: any;
  expire: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisCluster | Redis;
  private readonly lockClient: Redlock;

  constructor(
    configService: ConfigService,
    private readonly keyService: RedisKeyService,
  ) {
    const redis_urls = configService.get<string>(EnvKeys.REDIS_URL);
    if (!redis_urls) {
      throw new Error(`${EnvKeys.REDIS_URL} is not set`);
    }
    const urls: string[] = redis_urls.split(',').filter((it) => !!it);
    this.client = urls.length > 1 ? new RedisCluster(urls) : new Redis(urls[0]);

    this.lockClient = new Redlock([this.client], {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor: 0.01, // multiplied by lock ttl to determine drift time

      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount: 10,

      // the time in ms between attempts
      retryDelay: 500, // time in ms

      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter: 200, // time in ms

      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold: 500, // time in ms
    });
    this.lockClient.on('error', (error) => {
      // Ignore cases where a resource is explicitly marked as locked on a client.
      if (error instanceof ResourceLockedError) {
        return;
      }
      // Log all other errors.
      this.logger.error(`RedLock Error: ${error.message}`, error.stack);
    });
  }

  onModuleDestroy(): any {
    this.client.disconnect();
  }

  getClient() {
    return this.client;
  }

  getLockClient() {
    return this.lockClient;
  }

  keys() {
    return this.keyService;
  }
}
