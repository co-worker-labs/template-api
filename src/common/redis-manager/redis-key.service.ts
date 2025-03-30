import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { EnvKeys } from '../env-keys.enum';

@Injectable()
export class RedisKeyService {
  private readonly namespace: string;

  constructor(configService: ConfigService) {
    this.namespace = configService.getOrThrow<string>(EnvKeys.DATA_NAMESPACE);
  }

  signatureCerts() {
    return `${this.namespace}:signature:certs`;
  }

  signatureKeypair(id: bigint) {
    return `${this.namespace}:signature:keypair:${id}`;
  }

  signatureKeypairInitLock() {
    return `${this.namespace}:signature:keypair:init:lock`;
  }

  signatureKeypairAutoGenLock() {
    return `${this.namespace}:signature:keypair:auto_gen:lock`;
  }
}
