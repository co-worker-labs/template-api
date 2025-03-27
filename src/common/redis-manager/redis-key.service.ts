import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { EnvKeys } from '../env-keys.enum';

@Injectable()
export class RedisKeyService {
  private readonly appId: string;

  constructor(configService: ConfigService) {
    this.appId = configService.getOrThrow<string>(EnvKeys.APP_ID);
  }

  signatureCerts() {
    return `${this.appId}:signature:certs`;
  }

  signatureKeypair(id: bigint) {
    return `${this.appId}:signature:keypair:${id}`;
  }

  signatureKeypairInitLock() {
    return `${this.appId}:signature:keypair:init:lock`;
  }

  signatureKeypairAutoGenLock() {
    return `${this.appId}:signature:keypair:auto_gen:lock`;
  }
}
