import { Module } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { SignatureController } from './signature.controller';
import { SignatureAutoProcessor } from './signature-auto.processor';

@Module({
  controllers: [SignatureController],
  providers: [SignatureService, SignatureAutoProcessor],
  exports: [SignatureService],
})
export class SignatureModule {}
