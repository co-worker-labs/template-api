import { Controller, Get } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { KeypairVO } from './vo/keypair.vo';
import { AllowAnon } from '../auth/allow_anon.decorator';

@AllowAnon()
@Controller('signature')
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  @Get('certs')
  findAll(): Promise<KeypairVO[]> {
    return this.signatureService.findKeypairList();
  }
}
