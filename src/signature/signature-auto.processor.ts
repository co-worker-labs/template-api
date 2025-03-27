import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KEYPAIR_LIST_LENGTH, SignatureService } from './signature.service';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../common/redis-manager/redis-manager.service';
import { CacheService } from '../common/cache-manager/cache.service';

@Injectable()
export class SignatureAutoProcessor implements OnModuleInit {
  private readonly logger = new Logger(SignatureAutoProcessor.name);

  constructor(
    private readonly signatureService: SignatureService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    setTimeout(async () => {
      await this.checkAndGen();
    }, 1000);
  }

  async checkAndGen() {
    try {
      await this.redisService
        .getLockClient()
        .using(
          [this.redisService.keys().signatureKeypairInitLock()],
          1000 * 60 * 5,
          async (signal) => {
            const count = await this.signatureService.count();
            if (count <= 0) {
              const key = this.cacheService.keys().signatureCerts();
              await this.cacheService.manager().del(key);
              this.logger.log('init signature keypair on startup');
              await Promise.all(
                Array.from({ length: KEYPAIR_LIST_LENGTH }).map(() =>
                  this.signatureService.generate(),
                ),
              );
              setTimeout(async () => {
                await this.cacheService.manager().del(key);
              }, 1000 * 3);
            }
          },
        );
    } catch (e) {
      this.logger.error(e);
    }
  }

  /**
   * * * * * * *
   * | | | | | |
   * | | | | | day of week
   * | | | | months
   * | | | day of month
   * | | hours
   * | minutes
   * seconds (optional)
   */
  @Cron('1 1 1 * *')
  async autoGenMonthly() {
    try {
      await this.redisService
        .getLockClient()
        .using(
          [this.redisService.keys().signatureKeypairAutoGenLock()],
          1000 * 60 * 5,
          async (signal) => {
            this.logger.log('auto generate keypair monthly');
            const key = this.cacheService.keys().signatureCerts();
            await this.cacheService.manager().del(key);

            await this.signatureService.generate();

            const count = await this.signatureService.count();
            if (count > KEYPAIR_LIST_LENGTH * 2) {
              this.logger.log('remove oldest keypair monthly');
              await this.signatureService.deleteOldest();
            }
            setTimeout(async () => {
              await this.cacheService.manager().del(key);
            }, 1000 * 3);
          },
        );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
