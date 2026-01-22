import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.RUNNING_E2E === 'true';

  return {
    throttlers: [
      {
        ttl: 60000, // 1 minute
        limit: isTest ? 10000 : configService.get<number>('app.throttle.limit', 100),
      },
    ],
  };
};



