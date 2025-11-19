import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => {
  return {
    throttlers: [
      {
        ttl: 60000, // 1 minute
        limit: configService.get<number>('app.throttle.limit', 100),
      },
    ],
  };
};



