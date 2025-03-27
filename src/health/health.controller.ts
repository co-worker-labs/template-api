import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { AllowAnon } from '../auth/allow_anon.decorator';

@AllowAnon()
@Controller('health')
export class HealthController {
  constructor() {}

  @Get(['readiness', 'liveliness'])
  @HealthCheck()
  readiness() {
    return {
      status: 'ok',
    };
  }
}
