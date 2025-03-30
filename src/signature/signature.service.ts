import { Injectable, Logger } from '@nestjs/common';
import { KeypairVO } from './vo/keypair.vo';
import * as crypto from 'node:crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache-manager/cache.service';

export const KEYPAIR_LIST_LENGTH = 3;

const CERT_TTL = 1000 * 60 * 60 * 24;
const CERT_REFRESH_THRESHOLD = 1000 * 60 * 60 * 12;

const LOCAL_CACHE_MAX_SIZE = KEYPAIR_LIST_LENGTH * 2;
const LOCAL_CACHE_TTL = CERT_TTL;

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findKeypairList(): Promise<KeypairVO[]> {
    const key = this.cacheService.keys().signatureCerts();
    return this.cacheService.manager().wrap(
      key,
      async () => {
        const list = await this.prisma.signature_keypair.findMany({
          take: KEYPAIR_LIST_LENGTH,
          orderBy: { id: 'desc' },
          select: { id: true, public_key: true },
        });
        return list.map((it) => {
          return {
            id: it.id.toString(),
            publicKey: it.public_key,
          } as KeypairVO;
        });
      },
      {
        ttl: CERT_TTL,
        refreshThreshold: CERT_REFRESH_THRESHOLD,
      },
    );
  }

  cachedKeyObjects() {
    return this.cacheService.local(
      this.cacheService.localKeys().signatureKeyObject(),
      LOCAL_CACHE_MAX_SIZE,
    );
  }

  async decrypt(id: bigint, encrypted: string): Promise<string> {
    let keyObject = await this.cachedKeyObjects().get(id.toString());
    if (!keyObject) {
      const key = this.cacheService.keys().signatureKeypair(id);
      const privateKey = await this.cacheService.manager().wrap(
        key,
        async () => {
          const result = await this.prisma.signature_keypair.findUnique({
            where: { id },
            select: { private_key: true },
          });
          const privateKey = result?.private_key;
          if (!privateKey) {
            return null;
          }
        },
        {
          ttl: CERT_TTL,
          refreshThreshold: CERT_REFRESH_THRESHOLD,
        },
      );
      if (!privateKey) {
        return null;
      }
      keyObject = crypto.createPrivateKey({
        key: privateKey,
        format: 'pem',
        encoding: 'base64',
      });
      await this.cachedKeyObjects().set(
        id.toString(),
        keyObject,
        LOCAL_CACHE_TTL,
      );
    }
    try {
      return crypto
        .privateDecrypt(keyObject, Buffer.from(encrypted, 'base64'))
        .toString('utf8');
    } catch (e) {
      this.logger.error(`kid: ${id}, encrypted: ${encrypted}`, e.stack);
      return null;
    }
  }

  async generate() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    const base64PublicKey = Buffer.from(publicKey).toString('base64');
    const base64PrivateKey = Buffer.from(privateKey).toString('base64');
    await this.prisma.signature_keypair.create({
      data: {
        public_key: base64PublicKey,
        private_key: base64PrivateKey,
      },
    });
  }

  signature(secret: string, contents: Array<string>): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(contents.join(';'));
    return hmac.digest('hex');
  }

  count(): Promise<number> {
    return this.prisma.signature_keypair.count();
  }

  async deleteOldest() {
    const oldest = await this.prisma.signature_keypair.findFirst({
      orderBy: { id: 'asc' },
    });
    if (oldest) {
      await this.prisma.signature_keypair.delete({ where: { id: oldest.id } });
      const key = this.cacheService.keys().signatureKeypair(oldest.id);
      await this.cacheService.manager().del(key);
      await this.cachedKeyObjects().delete(oldest.id.toString());
    }
  }
}
