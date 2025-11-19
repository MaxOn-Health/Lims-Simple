import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.constructor.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.constructor.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
    }

    // Extract context information
    const user = request.user;
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // Log error with context
    const errorContext = {
      statusCode: status,
      error,
      message: Array.isArray(message) ? message : [message],
      path: request.url,
      method: request.method,
      userId: user?.userId || null,
      email: user?.email || null,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log critical errors (5xx) with error level, others with warn level
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${error}: ${Array.isArray(message) ? message.join(', ') : message}`,
        JSON.stringify(errorContext, null, 2),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${status}] ${error}: ${Array.isArray(message) ? message.join(', ') : message}`,
        JSON.stringify(errorContext, null, 2),
      );
    }

    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
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

