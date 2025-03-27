import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster as RedisCluster } from 'ioredis';
import { EnvKeys } from '../env-keys.enum';
import Redlock, { ResourceLockedError } from 'redlock';
import { RedisKeyService } from './redis-key.service';
import Keyv, { KeyvHooks } from 'keyv';
import KeyvRedis from '@keyv/redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly appId: string;
  private readonly client: RedisCluster | Redis;
  private readonly lockClient: Redlock;
  private readonly keyv: Keyv;

  constructor(
    configService: ConfigService,
    private readonly keyService: RedisKeyService,
  ) {
    this.appId = configService.getOrThrow<string>(EnvKeys.APP_ID);
    const redis_url = configService.get<string>(EnvKeys.REDIS_URL);
    if (!redis_url) {
      throw new Error(`${EnvKeys.REDIS_URL} is not set`);
    }
    this.client = RedisService.createClient(redis_url);
    this.lockClient = new Redlock([RedisService.createClient(redis_url)], {
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

    this.keyv = new Keyv({
      store: new KeyvRedis(redis_url, {
        useUnlink: false,
      }),
      namespace: this.appId,
      useKeyPrefix: false,
    });
    this.keyv.on('error', (error) => {
      this.logger.error(`Keyv Error: ${error.message}`, error.stack);
    });
    this.keyv.store.client.on('connect', () => {
      this.logger.log('KeyvRedis client connected');
    });
    this.keyv.store.client.on('reconnecting', () => {
      this.logger.log('KeyvRedis client reconnecting');
    });
    this.keyv.store.client.on('end', () => {
      this.logger.log('KeyvRedis client disconnected');
    });
    [KeyvHooks.PRE_SET, KeyvHooks.PRE_DELETE].forEach((hook) => {
      this.keyv.hooks.addHandler(hook, (key, value) => {
        this.logger.log({ tag: 'keyv', action: hook, key, value });
      });
    });
    [KeyvHooks.POST_GET, KeyvHooks.POST_GET_MANY].forEach((hook) => {
      this.keyv.hooks.addHandler(hook, (key, value) => {
        this.logger.debug({ tag: 'keyv', action: hook, key, value });
      });
    });
  }

  async onModuleDestroy() {
    this.client.disconnect();
    await Promise.all([this.keyv.disconnect(), this.lockClient.quit()]);
  }

  static createClient(redis_url: string) {
    const urls = redis_url.split(',').filter((it) => !!it);
    return urls.length > 1 ? new RedisCluster(urls) : new Redis(urls[0]);
  }

  getClient() {
    return this.client;
  }

  getLockClient() {
    return this.lockClient;
  }

  getKeyvClient() {
    return this.keyv;
  }

  keys() {
    return this.keyService;
  }
}
