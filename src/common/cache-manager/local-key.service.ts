import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalKeyService {
  constructor() {}

  jwks() {
    return 'jwks';
  }

  signatureKeyObject() {
    return 'signature:key:object';
  }
}
