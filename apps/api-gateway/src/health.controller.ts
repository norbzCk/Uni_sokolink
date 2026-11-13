import { Controller, Get, ServiceUnavailableException, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReadinessService } from './readiness.service';

@ApiTags('health')
@Version('1')
@Controller()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return { status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for required infrastructure' })
  async ready() {
    const checks = await this.readiness.check();
    const ready = Object.values(checks).every((status) => status === 'ok');
    const body = {
      status: ready ? ('ok' as const) : ('degraded' as const),
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      checks,
    };
    if (!ready) throw new ServiceUnavailableException(body);
    return body;
  }
}
