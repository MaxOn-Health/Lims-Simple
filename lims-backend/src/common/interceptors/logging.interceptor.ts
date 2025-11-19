import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second in milliseconds

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';

    // Skip logging for health checks
    if (url === '/health') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const user = (request as any).user;

        // Log slow queries
        if (responseTime > this.SLOW_QUERY_THRESHOLD) {
          this.logger.warn(
            `Slow query detected: ${method} ${url} took ${responseTime}ms`,
            {
              method,
              url,
              responseTime,
              userId: user?.userId || null,
              ipAddress: this.extractIpAddress(request),
            },
          );
        }

        // Log all requests in development mode
        if (nodeEnv === 'development') {
          this.logger.log(
            `${method} ${url} ${responseTime}ms`,
            {
              method,
              url,
              responseTime,
              statusCode: context.switchToHttp().getResponse().statusCode,
              userId: user?.userId || null,
            },
          );
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `Request failed: ${method} ${url} - ${error.message} (${responseTime}ms)`,
          error.stack,
        );
        throw error;
      }),
    );
  }

  private extractIpAddress(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket.remoteAddress || null;
  }
}

