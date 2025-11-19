import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { HealthService } from './services/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string' },
        service: { type: 'string' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            responseTime: { type: 'number' },
          },
        },
        system: {
          type: 'object',
          properties: {
            uptime: { type: 'number' },
            memory: { type: 'object' },
            cpu: { type: 'object' },
          },
        },
      },
    },
  })
  async check() {
    return this.healthService.checkHealth();
  }
}
