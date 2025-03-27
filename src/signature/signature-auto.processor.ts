import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KEYPAIR_LIST_LENGTH, SignatureService } from './signature.service';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../common/redis-manager/redis-manager.service';
import { isEmptyArray } from '../common/fns';

@Injectable()
export class SignatureAutoProcessor implements OnModuleInit {
  private readonly logger = new Logger(SignatureAutoProcessor.name);

  constructor(
    private readonly signatureService: SignatureService,
    private readonly redisService: RedisService,
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
            const list = await this.signatureService.findKeypairList();
            if (isEmptyArray(list)) {
              this.logger.log('init signature keypair on startup');
              await Promise.all(
                Array.from({ length: KEYPAIR_LIST_LENGTH }).map(() =>
                  this.signatureService.generate(),
                ),
              );
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
            await this.signatureService.generate();

            const count = await this.signatureService.count();
            if (count > KEYPAIR_LIST_LENGTH * 2) {
              this.logger.log('remove oldest keypair monthly');
              await this.signatureService.deleteOldest();
            }
          },
        );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
